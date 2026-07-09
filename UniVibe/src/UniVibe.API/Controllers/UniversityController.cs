using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UniVibe.Application.Common;
using UniVibe.Application.Interfaces;

namespace UniVibe.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [AllowAnonymous]
    public class UniversityController : ControllerBase
    {
        private readonly IUniversityService _universityService;

        public UniversityController(IUniversityService universityService)
        {
            _universityService = universityService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllUniversities()
        {
            var result = await _universityService.GetAllUniversitiesAsync();
            return Ok(ApiResponse<object>.Success(result));
        }

        [HttpGet("{universityId}/faculties")]
        public async Task<IActionResult> GetFacultiesByUniversityId(Guid universityId)
        {
            var result = await _universityService.GetFacultiesByUniversityIdAsync(universityId);
            return Ok(ApiResponse<object>.Success(result));
        }

        [HttpGet("faculties/{facultyId}/departments")]
        public async Task<IActionResult> GetDepartments(Guid facultyId)
        {
            var result = await _universityService.GetDepartmentsByFacultyIdAsync(facultyId);
            return Ok(ApiResponse<object>.Success(result));
        }
    }
}
