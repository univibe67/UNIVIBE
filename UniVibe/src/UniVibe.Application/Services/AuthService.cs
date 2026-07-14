using UniVibe.Application.DTOs.Auth.Requests;
using UniVibe.Application.DTOs.Auth.Responses;
using UniVibe.Application.Interfaces;
using UniVibe.Application.Interfaces.Repositories;
using UniVibe.Domain.Entities;

namespace UniVibe.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly IPendingUserRepository _pendingUserRepository;
        private readonly IUserRepository _userRepository;
        private readonly IDepartmentRepository _departmentRepository;
        private readonly IUniversityRepository _universityRepository; 
        private readonly IFacultyRepository _facultyRepository;       
        private readonly IEmailService _emailService;
        private readonly IPasswordHasher _passwordHasher;
        private readonly ITokenService _tokenService;

        public AuthService(
            IPendingUserRepository pendingUserRepository,
            IEmailService emailService,
            IUserRepository userRepository,
            IPasswordHasher passwordHasher,
            ITokenService tokenService,
            IDepartmentRepository departmentRepository,
            IUniversityRepository universityRepository,
            IFacultyRepository facultyRepository)
        {
            _pendingUserRepository = pendingUserRepository;
            _emailService = emailService;
            _userRepository = userRepository;
            _passwordHasher = passwordHasher;
            _tokenService = tokenService;
            _departmentRepository = departmentRepository;
            _universityRepository = universityRepository;
            _facultyRepository = facultyRepository;
        }

        public async Task<LoginResponse> LoginAsync(LoginRequest request)
        {
            var user = await _userRepository.FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null)
                throw new Exception("E-posta veya şifre hatalı.");

            var isPasswordValid = _passwordHasher.Verify(request.Password, user.PasswordHash);
            if (!isPasswordValid)
                throw new Exception("E-posta veya şifre hatalı.");

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
                        throw new Exception("Hesabınızı silmenizin üzerinden 15 günden fazla zaman geçmiş. Lütfen yeni bir hesap açın.");
                    }
                }
            }

            var token = _tokenService.GenerateToken(user);
            var refreshToken = _tokenService.GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(30);

            await _userRepository.UpdateAsync(user);

            return new LoginResponse(token, refreshToken, user.FirstName, user.LastName);
        }

        public async Task<string> InitiateRegistrationAsync(string email)
        {
            var existingUser = await _userRepository.FirstOrDefaultAsync(u => u.Email == email);

            if (existingUser != null)
            {
                if (existingUser.IsActive)
                {
                    throw new Exception("Bu e-posta adresi ile zaten kayıtlı aktif bir kullanıcı bulunuyor.");
                }

                if (!existingUser.IsActive && existingUser.DeletedAt.HasValue)
                {
                    var gecenSure = (DateTime.UtcNow - existingUser.DeletedAt.Value).TotalDays;

                    if (gecenSure < 15)
                    {
                        int kalanGun = 15 - (int)gecenSure;
                        throw new Exception($"Bu e-posta ile silinme sürecinde olan bir hesap var. Hesabınızı 'Giriş Yap' ekranından kurtarabilir veya tamamen silinmesi için {kalanGun} gün bekleyebilirsiniz.");
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

                        await _userRepository.UpdateAsync(existingUser);
                    }
                }
            }

            var existingPending = await _pendingUserRepository.FirstOrDefaultAsync(u => u.Email == email);
            if (existingPending != null)
            {
                await _pendingUserRepository.DeleteAsync(existingPending);
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
                await _pendingUserRepository.DeleteAsync(pendingUser);
                throw new Exception("Mail gönderilemedi, lütfen bilgileri kontrol et. Hata: " + ex.Message);
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
            await _pendingUserRepository.UpdateAsync(pendingUser);

            return true;
        }

        public async Task<LoginResponse> CompleteRegistrationAsync(RegisterCompleteRequest request)
        {
            var pendingUser = await _pendingUserRepository.FirstOrDefaultAsync(u => u.Token == request.Token && u.IsUsed);
            if (pendingUser == null)
                throw new Exception("Geçersiz veya süresi dolmuş işlem.");

            /* ŞİMDİLİK TEST İÇİN DEVRE DIŞI BIRAKTIK (Canlıya çıkarken açacağız veya güncelleyeceğiz)
            var emailDomain = pendingUser.Email.Split('@').LastOrDefault();
            var university = await _universityRepository.FirstOrDefaultAsync(u => u.EmailDomain.ToLower() == emailDomain!.ToLower());
            if (university == null)
                 throw new Exception($"Sistemimizde '{emailDomain}' uzantısına tanımlı bir üniversite bulunmamaktadır.");
            */

            var isUsernameTaken = await _userRepository.AnyAsync(u => u.Username.ToLower() == request.Username.ToLower());
            if (isUsernameTaken)
                throw new Exception("Bu kullanıcı adı zaten alınmış. Lütfen başka bir tane deneyin.");

            var department = await _departmentRepository.FirstOrDefaultAsync(d => d.Id == request.DepartmentId);
            if (department == null)
                throw new Exception("Seçilen bölüm sistemde bulunamadı.");

            // TEST İÇİN KAPATILDI: Seçilen bölümün, adamın e-postasındaki üniversiteye ait olup olmadığı kontrolü
            // (Çünkü yukarıdaki university değişkenini kapattık, burası patlar)
            /*
            var faculty = await _facultyRepository.FirstOrDefaultAsync(f => f.Id == department.FacultyId);
            if (faculty == null || faculty.UniversityId != university.Id)
                throw new Exception("Seçtiğiniz bölüm, e-posta adresinizin bağlı olduğu üniversiteye ait değil! Lütfen kendi üniversitenizin bölümlerinden birini seçin.");
            */

            var newUser = new User
            {
                Username = request.Username,
                Email = pendingUser.Email,
                PasswordHash = _passwordHasher.Hash(request.Password),
                FirstName = request.FirstName,
                LastName = request.LastName,
                PhoneNumber = request.PhoneNumber,
                DepartmentId = request.DepartmentId,
                Grade = request.Grade,
                IsActive = true,
                ProfilePictureUrl = $"https://ui-avatars.com/api/?name={request.FirstName}+{request.LastName}&background=random&color=fff",

                RefreshToken = _tokenService.GenerateRefreshToken(),
                RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(30)
            };

            await _userRepository.AddAsync(newUser);
            await _pendingUserRepository.DeleteAsync(pendingUser);

            var accessToken = _tokenService.GenerateToken(newUser);
            return new LoginResponse(accessToken, newUser.RefreshToken, newUser.FirstName, newUser.LastName);
        }
        public async Task<LoginResponse> RefreshTokenAsync(RefreshTokenRequest request)
        {
            var user = await _userRepository.FirstOrDefaultAsync(u => u.RefreshToken == request.RefreshToken);

            if (user == null || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
                throw new Exception("Oturum süreniz dolmuş. Lütfen tekrar giriş yapınız.");

            var newAccessToken = _tokenService.GenerateToken(user);

            var newRefreshToken = _tokenService.GenerateRefreshToken();

            user.RefreshToken = newRefreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(30);

            await _userRepository.UpdateAsync(user);

            return new LoginResponse(newAccessToken, newRefreshToken, user.FirstName, user.LastName);
        }
    }
}