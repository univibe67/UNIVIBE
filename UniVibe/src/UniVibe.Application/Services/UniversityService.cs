using UniVibe.Application.DTOs.University;
using UniVibe.Application.Interfaces;
using UniVibe.Application.Interfaces.Repositories;
using UniVibe.Domain.Entities;

namespace UniVibe.Application.Services
{
    public class UniversityService : IUniversityService
    {
        private readonly IGenericRepository<Faculty> _facultyRepository;
        private readonly IGenericRepository<Department> _departmentRepository;

        public UniversityService(IGenericRepository<Faculty> facultyRepository, IGenericRepository<Department> departmentRepository)
        {
            _facultyRepository = facultyRepository;
            _departmentRepository = departmentRepository;
        }

        public async Task<List<FacultyLookupDto>> GetFacultiesAsync()
        {
            var faculties = await _facultyRepository.GetAllAsync(f => f.IsActive);
            return faculties.Select(f => new FacultyLookupDto { Id = f.Id, Name = f.Name }).ToList();
        }

        public async Task<List<DepartmentLookupDto>> GetDepartmentsByFacultyIdAsync(Guid facultyId)
        {
            var departments = await _departmentRepository.GetAllAsync(d => d.FacultyId == facultyId && d.IsActive);
            return departments.Select(d => new DepartmentLookupDto
            {
                Id = d.Id,
                Name = d.Name,
                FacultyId = d.FacultyId
            }).ToList();
        }
    }
}