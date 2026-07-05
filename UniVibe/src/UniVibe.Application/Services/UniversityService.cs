using Microsoft.Extensions.Caching.Memory;
using UniVibe.Application.DTOs.University;
using UniVibe.Application.Interfaces;
using UniVibe.Application.Interfaces.Repositories;

namespace UniVibe.Application.Services
{
    public class UniversityService : IUniversityService
    {
        private readonly IUniversityRepository _universityRepository;
        private readonly IFacultyRepository _facultyRepository;
        private readonly IDepartmentRepository _departmentRepository;
        private readonly IMemoryCache _memoryCache;

        public UniversityService(IUniversityRepository universityRepository, IFacultyRepository facultyRepository, IDepartmentRepository departmentRepository, IMemoryCache memoryCache)
        {
            _universityRepository = universityRepository;
            _facultyRepository = facultyRepository;
            _departmentRepository = departmentRepository;
            _memoryCache = memoryCache;
        }

        public async Task<List<UniversityLookupDto>> GetAllUniversitiesAsync()
        {
            const string cacheKey = "all_universities_cache";

            if (!_memoryCache.TryGetValue(cacheKey, out List<UniversityLookupDto> cachedUniversities))
            {
                var universities = await _universityRepository.GetAllAsync(u => u.IsActive && !u.IsDeleted);

                cachedUniversities = universities.OrderBy(u => u.Name).Select(u => new UniversityLookupDto
                {
                    Id = u.Id,
                    Name = u.Name,
                    EmailDomain = u.EmailDomain
                }).ToList();

                var cacheOptions = new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(TimeSpan.FromDays(7));

                _memoryCache.Set(cacheKey, cachedUniversities, cacheOptions);
            }

            return cachedUniversities ?? new();
        }

        public async Task<List<FacultyLookupDto>> GetFacultiesByUniversityIdAsync(Guid universityId)
        {
            string cacheKey = $"faculties_univ_{universityId}";

            if (!_memoryCache.TryGetValue(cacheKey, out List<FacultyLookupDto> cachedFaculties))
            {
                var faculties = await _facultyRepository.GetAllAsync(f => f.UniversityId == universityId && f.IsActive && !f.IsDeleted);

                cachedFaculties = faculties.OrderBy(f => f.Name).Select(f => new FacultyLookupDto
                {
                    Id = f.Id,
                    Name = f.Name
                }).ToList();

                var cacheOptions = new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(TimeSpan.FromDays(7));

                _memoryCache.Set(cacheKey, cachedFaculties, cacheOptions);
            }

            return cachedFaculties ?? new();
        }

        public async Task<List<DepartmentLookupDto>> GetDepartmentsByFacultyIdAsync(Guid facultyId)
        {
            string cacheKey = $"depts_fac_{facultyId}";

            if (!_memoryCache.TryGetValue(cacheKey, out List<DepartmentLookupDto> cachedDepartments))
            {
                var departments = await _departmentRepository.GetAllAsync(d => d.FacultyId == facultyId && d.IsActive && !d.IsDeleted);

                cachedDepartments = departments.OrderBy(d => d.Name).Select(d => new DepartmentLookupDto
                {
                    Id = d.Id,
                    Name = d.Name
                }).ToList();

                var cacheOptions = new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(TimeSpan.FromDays(7));

                _memoryCache.Set(cacheKey, cachedDepartments, cacheOptions);
            }

            return cachedDepartments ?? new();
        }
    }
}