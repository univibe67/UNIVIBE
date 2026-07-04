using UniVibe.Application.DTOs.University;
using UniVibe.Application.Interfaces;
using UniVibe.Application.Interfaces.Repositories;
using UniVibe.Domain.Entities;

namespace UniVibe.Application.Services
{
    public class UniversityService : IUniversityService
    {
        private readonly IUniversityRepository _universityRepository;
        private readonly IFacultyRepository _facultyRepository;
        private readonly IDepartmentRepository _departmentRepository;

        public UniversityService(IUniversityRepository universityRepository, IFacultyRepository facultyRepository, IDepartmentRepository departmentRepository)
        {
            _universityRepository = universityRepository;
            _facultyRepository = facultyRepository;
            _departmentRepository = departmentRepository;
        }

        public async Task<List<UniversityLookupDto>> GetAllUniversitiesAsync()
        {
            var universities = await _universityRepository.GetAllAsync(u => u.IsActive && !u.IsDeleted);

            return universities.OrderBy(u => u.Name).Select(u => new UniversityLookupDto
            {
                Id = u.Id,
                Name = u.Name,
                EmailDomain = u.EmailDomain
            }).ToList();
        }

        public async Task<List<FacultyLookupDto>> GetFacultiesByUniversityIdAsync(Guid universityId)
        {
            var faculties = await _facultyRepository.GetAllAsync(f => f.UniversityId == universityId && f.IsActive && !f.IsDeleted);

            return faculties.OrderBy(f => f.Name).Select(f => new FacultyLookupDto
            {
                Id = f.Id,
                Name = f.Name
            }).ToList();
        }

        public async Task<List<DepartmentLookupDto>> GetDepartmentsByFacultyIdAsync(Guid facultyId)
        {
            var departments = await _departmentRepository.GetAllAsync(d => d.FacultyId == facultyId && d.IsActive && !d.IsDeleted);

            return departments.OrderBy(d => d.Name).Select(d => new DepartmentLookupDto
            {
                Id = d.Id,
                Name = d.Name
            }).ToList();
        }
    }
}