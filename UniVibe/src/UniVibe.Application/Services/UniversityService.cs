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

        public UniversityService(
            IUniversityRepository universityRepository,
            IFacultyRepository facultyRepository,
            IDepartmentRepository departmentRepository,
            IMemoryCache memoryCache,
            IMapper mapper)
        {
            _universityRepository = universityRepository;
            _facultyRepository = facultyRepository;
            _departmentRepository = departmentRepository;
            _memoryCache = memoryCache;
            _mapper = mapper;
        }

        public async Task<List<UniversityLookupResponse>> GetAllUniversitiesAsync()
        {
            return await _memoryCache.GetOrCreateAsync("all_universities_cache", async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(7);
                var universities = await _universityRepository.GetAllAsync(u => u.IsActive);
                return _mapper.Map<List<UniversityLookupResponse>>(universities.OrderBy(u => u.Name));
            }) ?? new();
        }

        public async Task<List<FacultyLookupResponse>> GetFacultiesByUniversityIdAsync(Guid universityId)
        {
            return await _memoryCache.GetOrCreateAsync($"faculties_univ_{universityId}", async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(7);
                var faculties = await _facultyRepository.GetAllAsync(f => f.UniversityId == universityId && f.IsActive);
                return _mapper.Map<List<FacultyLookupResponse>>(faculties.OrderBy(f => f.Name));
            }) ?? new();
        }

        public async Task<List<DepartmentLookupResponse>> GetDepartmentsByFacultyIdAsync(Guid facultyId)
        {
            return await _memoryCache.GetOrCreateAsync($"depts_fac_{facultyId}", async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(7);
                var departments = await _departmentRepository.GetAllAsync(d => d.FacultyId == facultyId && d.IsActive);
                return _mapper.Map<List<DepartmentLookupResponse>>(departments.OrderBy(d => d.Name));
            }) ?? new();
        }
    }
}