using UniVibe.Application.DTOs.University;

namespace UniVibe.Application.Interfaces
{
    public interface IUniversityService
    {
        Task<List<FacultyLookupDto>> GetFacultiesAsync();
        Task<List<DepartmentLookupDto>> GetDepartmentsByFacultyIdAsync(Guid facultyId);
    }
}
