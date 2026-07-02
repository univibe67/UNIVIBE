using Microsoft.AspNetCore.Mvc;
using UniVibe.Application.Interfaces;

namespace UniVibe.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UniversityController : ControllerBase
    {
        private readonly IUniversityService _universityService;

        public UniversityController(IUniversityService universityService)
        {
            _universityService = universityService;
        }

        [HttpGet("faculties")]
        public async Task<IActionResult> GetFaculties()
        {
            var result = await _universityService.GetFacultiesAsync();
            return Ok(result);
        }

        [HttpGet("faculties/{facultyId}/departments")]
        public async Task<IActionResult> GetDepartments(Guid facultyId)
        {
            var result = await _universityService.GetDepartmentsByFacultyIdAsync(facultyId);
            return Ok(result);
        }
    }
}
