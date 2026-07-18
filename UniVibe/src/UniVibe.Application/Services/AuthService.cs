using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Auth.Requests;
using UniVibe.Application.DTOs.Auth.Responses;
using UniVibe.Application.Interfaces;
using UniVibe.Application.Interfaces.Repositories;
using UniVibe.Domain.Entities;
using UniVibe.Domain.Enums;

namespace UniVibe.Application.Services
{
    public sealed class AuthService : IAuthService
    {
        private readonly IPendingUserRepository _pendingUserRepository;
        private readonly IUserRepository _userRepository;
        private readonly IDepartmentRepository _departmentRepository;
        private readonly IUniversityRepository _universityRepository;
        private readonly IFacultyRepository _facultyRepository;
        private readonly IEmailService _emailService;
        private readonly IPasswordHasher _passwordHasher;
        private readonly ITokenService _tokenService;
        private readonly IUnitOfWork _unitOfWork;

        public AuthService(
            IPendingUserRepository pendingUserRepository,
            IEmailService emailService,
            IUserRepository userRepository,
            IPasswordHasher passwordHasher,
            ITokenService tokenService,
            IDepartmentRepository departmentRepository,
            IUniversityRepository universityRepository,
            IFacultyRepository facultyRepository,
            IUnitOfWork unitOfWork)
        {
            _pendingUserRepository = pendingUserRepository;
            _emailService = emailService;
            _userRepository = userRepository;
            _passwordHasher = passwordHasher;
            _tokenService = tokenService;
            _departmentRepository = departmentRepository;
            _universityRepository = universityRepository;
            _facultyRepository = facultyRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<LoginResponse> LoginAsync(LoginRequest request)
        {
            var user = await _userRepository.FirstOrDefaultAsync(u => u.Email == request.Email && !u.IsDeleted);

            if (user == null)
                throw new Exception(ServicesMessages.AuthMessages.InvalidCredentials);

            var isPasswordValid = _passwordHasher.Verify(request.Password, user.PasswordHash);
            if (!isPasswordValid)
                throw new Exception(ServicesMessages.AuthMessages.InvalidCredentials);

            if (!user.IsActive)
            {
                if (user.DeletedAt.HasValue)
                {
                    var gecenSure = (DateTime.UtcNow - user.DeletedAt.Value).TotalDays;

                    if (gecenSure < 15)
                    {
                        user.IsActive = true;
                        user.DeletedAt = null;
                    }
                    else
                    {
                        throw new Exception(ServicesMessages.AuthMessages.AccountDeletedTooLong);
                    }
                }
                else
                {
                    throw new Exception(ServicesMessages.AuthMessages.AccountSuspended);
                }
            }

            var token = _tokenService.GenerateToken(user);
            var refreshToken = _tokenService.GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(30);

            _userRepository.Update(user);
            await _unitOfWork.SaveChangesAsync();

            return new LoginResponse(token, refreshToken, user.FirstName, user.LastName);
        }

        public async Task<string> InitiateRegistrationAsync(string email)
        {

            // CANLIYA CIKARKEN ACILACAK: Sadece .edu.tr uzantılı mailleri kabul etme kurali
            /*
            if (!email.EndsWith(".edu.tr"))
            {
                throw new Exception("Sisteme sadece '.edu.tr' uzantili üniversite e-posta adresinizle kayit olabilirsiniz.");
            }
            */
            var existingUser = await _userRepository.FirstOrDefaultAsync(u => u.Email == email);

            if (existingUser != null)
            {
                if (existingUser.IsActive)
                {
                    throw new Exception(ServicesMessages.AuthMessages.EmailAlreadyActive);
                }

                if (!existingUser.IsActive && existingUser.DeletedAt.HasValue)
                {
                    var gecenSure = (DateTime.UtcNow - existingUser.DeletedAt.Value).TotalDays;

                    if (gecenSure < 15)
                    {
                        int kalanGun = 15 - (int)gecenSure;
                        throw new Exception(ServicesMessages.AuthMessages.AccountInDeletionProcess.Replace("{0}", kalanGun.ToString()));
                    }
                    else
                    {
                        string damga = Guid.NewGuid().ToString().Substring(0, 8);

                        existingUser.Email = $"deleted_{damga}@univibe.com";
                        existingUser.Username = $"deleted_user_{damga}";
                        existingUser.FirstName = "Silinmiş";
                        existingUser.LastName = "Kullanıcı";
                        existingUser.Bio = null;
                        existingUser.SocialMediaLink = null;
                        existingUser.ProfilePictureUrl = null;

                        _userRepository.Update(existingUser);
                    }
                }
            }

            var existingPending = await _pendingUserRepository.FirstOrDefaultAsync(u => u.Email == email);
            if (existingPending != null)
            {
                _pendingUserRepository.Delete(existingPending);
            }

            var token = Guid.NewGuid().ToString();
            var pendingUser = new PendingUser
            {
                Email = email,
                Token = token,
                ExpiryDate = DateTime.UtcNow.AddMinutes(5),
                IsUsed = false
            };

            await _pendingUserRepository.AddAsync(pendingUser);
            await _unitOfWork.SaveChangesAsync();

            try
            {
                string webBridgeLink = $"http://192.168.1.110:5000/api/Auth/verify-redirect?token={token}";

                string mailBody = $@"
                    <h3>UniVibe'a Hoş Geldin!</h3>
                    <p>Kampüsün nabzını tutmaya çok az kaldı. Kaydını tamamlamak için lütfen aşağıdaki bağlantıya tıkla:</p>
                    <a href='{webBridgeLink}' style='background-color:#3B82F6; color:white; padding:12px 20px; text-decoration:none; border-radius:8px; font-weight:bold; display:inline-block;'>Hesabımı Doğrula</a>
                    <br><br>
                    <small>Eğer buton çalışmazsa bu linki tarayıcına yapıştırabilirsin: {webBridgeLink}</small>";

                await _emailService.SendEmailAsync(email, "UniVibe Kayıt Onayı", mailBody);
            }
            catch (Exception ex)
            {
                _pendingUserRepository.Delete(pendingUser);
                await _unitOfWork.SaveChangesAsync();
                throw new Exception(ServicesMessages.AuthMessages.EmailSendFailed.Replace("{0}", ex.Message));
            }

            return token;
        }

        public async Task<bool> VerifyTokenAsync(string token)
        {
            var pendingUser = await _pendingUserRepository.FirstOrDefaultAsync(u => u.Token == token && !u.IsUsed);
            if (pendingUser == null || pendingUser.ExpiryDate < DateTime.UtcNow)
            {
                return false;
            }

            pendingUser.IsUsed = true;
             _pendingUserRepository.Update(pendingUser);
            await _unitOfWork.SaveChangesAsync();

            return true;
        }

        public async Task<LoginResponse> CompleteRegistrationAsync(RegisterCompleteRequest request)
        {
            var pendingUser = await _pendingUserRepository.FirstOrDefaultAsync(u => u.Token == request.Token && u.IsUsed);
            if (pendingUser == null)
                throw new Exception(ServicesMessages.AuthMessages.InvalidOrExpiredToken);

            /* ŞİMDİLİK TEST İÇİN DEVRE DIŞI BIRAKTIK (Canlıya çıkarken açacağız veya güncelleyeceğiz)
            var emailDomain = pendingUser.Email.Split('@').LastOrDefault();
            var university = await _universityRepository.FirstOrDefaultAsync(u => u.EmailDomain.ToLower() == emailDomain!.ToLower());
            if (university == null)
                 throw new Exception($"Sistemimizde '{emailDomain}' uzantısına tanımlı bir üniversite bulunmamaktadır.");
            */

            var isUsernameTaken = await _userRepository.AnyAsync(u => u.Username.ToLower() == request.Username.ToLower());
            if (isUsernameTaken)
                throw new Exception(ServicesMessages.AuthMessages.UsernameTaken);

            var department = await _departmentRepository.FirstOrDefaultAsync(d => d.Id == request.DepartmentId);
            if (department == null)
                throw new Exception(ServicesMessages.AuthMessages.DepartmentNotFound);

            // TEST İÇİN KAPATILDI: Seçilen bölümün, adamın e-postasındaki üniversiteye ait olup olmadığı kontrolü
            // (Çünkü yukarıdaki university değişkenini kapattık, burası patlar)
            /*
            var faculty = await _facultyRepository.FirstOrDefaultAsync(f => f.Id == department.FacultyId);
            if (faculty == null || faculty.UniversityId != university.Id)
                throw new Exception("Seçtiğiniz bölüm, e-posta adresinizin bağlı olduğu üniversiteye ait değil! Lütfen kendi üniversitenizin bölümlerinden birini seçin.");
            */
            var assignedRole = UserRole.Student;
            if (pendingUser.Email.Contains("@beun.edu.tr"))
            {
                assignedRole = UserRole.Teacher;
            }
            if (assignedRole == UserRole.Student)
            {
                if (!request.Grade.HasValue)
                    throw new Exception(ServicesMessages.AuthMessages.StudentGradeRequired);

                request.Title = null;
            }
            if (assignedRole == UserRole.Teacher)
            {
                if (string.IsNullOrWhiteSpace(request.Title))
                    throw new Exception(ServicesMessages.AuthMessages.TeacherTitleRequired);

                request.Grade = null;
            }

            var newUser = new User
            {
                Username = request.Username,
                Email = pendingUser.Email,
                PasswordHash = _passwordHasher.Hash(request.Password),
                FirstName = request.FirstName,
                LastName = request.LastName,
                PhoneNumber = request.PhoneNumber,
                Title = request.Title,
                DepartmentId = request.DepartmentId,
                Grade = request.Grade,
                Role = assignedRole,
                IsActive = true,
                ProfilePictureUrl = $"https://ui-avatars.com/api/?name={request.FirstName}+{request.LastName}&background=random&color=fff",

                RefreshToken = _tokenService.GenerateRefreshToken(),
                RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(30)
            };

            await _userRepository.AddAsync(newUser);
             _pendingUserRepository.Delete(pendingUser);
            await _unitOfWork.SaveChangesAsync();

            var accessToken = _tokenService.GenerateToken(newUser);
            return new LoginResponse(accessToken, newUser.RefreshToken, newUser.FirstName, newUser.LastName);
        }
        public async Task<LoginResponse> RefreshTokenAsync(RefreshTokenRequest request)
        {
            var user = await _userRepository.FirstOrDefaultAsync(u => u.RefreshToken == request.RefreshToken);

            if (user == null || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
                throw new Exception(ServicesMessages.AuthMessages.SessionExpired);

            var newAccessToken = _tokenService.GenerateToken(user);

            var newRefreshToken = _tokenService.GenerateRefreshToken();

            user.RefreshToken = newRefreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(30);

            _userRepository.Update(user);
            await _unitOfWork.SaveChangesAsync();

            return new LoginResponse(newAccessToken, newRefreshToken, user.FirstName, user.LastName);
        }
    }
}