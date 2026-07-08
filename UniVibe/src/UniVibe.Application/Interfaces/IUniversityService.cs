using UniVibe.Application.DTOs.University.Responses;

namespace UniVibe.Application.Interfaces
{
    public interface IUniversityService
    {
        Task<List<UniversityLookupResponse>> GetAllUniversitiesAsync();

        Task<List<FacultyLookupResponse>> GetFacultiesByUniversityIdAsync(Guid universityId);

        Task<List<DepartmentLookupResponse>> GetDepartmentsByFacultyIdAsync(Guid facultyId);
    }
}
