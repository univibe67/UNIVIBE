using AutoMapper;
using Microsoft.Extensions.Caching.Memory;
using UniVibe.Application.DTOs.University.Responses;
using UniVibe.Application.Interfaces;
using UniVibe.Application.Interfaces.Repositories;

namespace UniVibe.Application.Services
{
    public sealed class UniversityService : IUniversityService
    {
        private readonly IUniversityRepository _universityRepository;
        private readonly IFacultyRepository _facultyRepository;
        private readonly IDepartmentRepository _departmentRepository;
        private readonly IMemoryCache _memoryCache;
        private readonly IMapper _mapper;

        public UniversityService(IUniversityRepository universityRepository, IFacultyRepository facultyRepository, IDepartmentRepository departmentRepository, IMemoryCache memoryCache, IMapper mapper)
        {
            _universityRepository = universityRepository;
            _facultyRepository = facultyRepository;
            _departmentRepository = departmentRepository;
            _memoryCache = memoryCache;
            _mapper = mapper;
        }

        public async Task<List<UniversityLookupResponse>> GetAllUniversitiesAsync()
        {
            const string cacheKey = "all_universities_cache";

            if (!_memoryCache.TryGetValue(cacheKey, out List<UniversityLookupResponse> cachedUniversities))
            {
                var universities = await _universityRepository.GetAllAsync(u => u.IsActive && !u.IsDeleted);

                cachedUniversities = _mapper.Map<List<UniversityLookupResponse>>(universities.OrderBy(u => u.Name));

                var cacheOptions = new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(TimeSpan.FromDays(7));

                _memoryCache.Set(cacheKey, cachedUniversities, cacheOptions);
            }

            return cachedUniversities ?? new();
        }

        public async Task<List<FacultyLookupResponse>> GetFacultiesByUniversityIdAsync(Guid universityId)
        {
            string cacheKey = $"faculties_univ_{universityId}";

            if (!_memoryCache.TryGetValue(cacheKey, out List<FacultyLookupResponse> cachedFaculties))
            {
                var faculties = await _facultyRepository.GetAllAsync(f => f.UniversityId == universityId && f.IsActive && !f.IsDeleted);

                cachedFaculties = _mapper.Map<List<FacultyLookupResponse>>(faculties.OrderBy(f => f.Name));

                var cacheOptions = new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(TimeSpan.FromDays(7));

                _memoryCache.Set(cacheKey, cachedFaculties, cacheOptions);
            }

            return cachedFaculties ?? new();
        }

        public async Task<List<DepartmentLookupResponse>> GetDepartmentsByFacultyIdAsync(Guid facultyId)
        {
            string cacheKey = $"depts_fac_{facultyId}";

            if (!_memoryCache.TryGetValue(cacheKey, out List<DepartmentLookupResponse> cachedDepartments))
            {
                var departments = await _departmentRepository.GetAllAsync(d => d.FacultyId == facultyId && d.IsActive && !d.IsDeleted);

                cachedDepartments = _mapper.Map<List<DepartmentLookupResponse>>(departments.OrderBy(d => d.Name));

                var cacheOptions = new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(TimeSpan.FromDays(7));

                _memoryCache.Set(cacheKey, cachedDepartments, cacheOptions);
            }

            return cachedDepartments ?? new();
        }
    }
}