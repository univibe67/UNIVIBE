using UniVibe.Application.DTOs.University;

namespace UniVibe.Application.Interfaces
{
    public interface IUniversityService
    {
        Task<List<UniversityLookupDto>> GetAllUniversitiesAsync();

        Task<List<FacultyLookupDto>> GetFacultiesByUniversityIdAsync(Guid universityId);

        Task<List<DepartmentLookupDto>> GetDepartmentsByFacultyIdAsync(Guid facultyId);
    }
}
