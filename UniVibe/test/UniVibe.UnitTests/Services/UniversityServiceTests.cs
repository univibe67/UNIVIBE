using AutoMapper;
using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Moq;
using UniVibe.Application.DTOs.University.Responses;
using UniVibe.Application.Interfaces.Repositories;
using UniVibe.Application.Services;
using UniVibe.Domain.Entities;

namespace UniVibe.UnitTests.Services
{
    public class UniversityServiceTests
    {
        private readonly Mock<IUniversityRepository> _universityRepoMock;
        private readonly Mock<IFacultyRepository> _facultyRepoMock;
        private readonly Mock<IDepartmentRepository> _departmentRepoMock;
        private readonly Mock<IMemoryCache> _memoryCacheMock;
        private readonly Mock<IMapper> _mapperMock;

        private readonly UniversityService _universityService;

        public UniversityServiceTests()
        {
            _universityRepoMock = new Mock<IUniversityRepository>();
            _facultyRepoMock = new Mock<IFacultyRepository>();
            _departmentRepoMock = new Mock<IDepartmentRepository>();
            _memoryCacheMock = new Mock<IMemoryCache>();
            _mapperMock = new Mock<IMapper>();

            _universityService = new UniversityService(
                _universityRepoMock.Object,
                _facultyRepoMock.Object,
                _departmentRepoMock.Object,
                _memoryCacheMock.Object,
                _mapperMock.Object
            );
        }

        // ==========================================
        // 1. TESTS FOR GetAllUniversitiesAsync
        // ==========================================
        [Fact]
        public async Task GetAllUniversitiesAsync_ShouldReturnCachedOrFetchedUniversities()
        {
            // Arrange
            var universities = new List<University>
            {
                new University { Id = Guid.NewGuid(), Name = "Zonguldak Bülent Ecevit Üniversitesi", IsActive = true }
            };
            var expectedResponse = new List<UniversityLookupResponse>
            {
                new UniversityLookupResponse { Id = universities[0].Id, Name = "Zonguldak Bülent Ecevit Üniversitesi" }
            };

            // IMemoryCache.GetOrCreateAsync extension metodu arkada CreateEntry kullanır. 
            // Bu yüzden cache mekanizmasını simüle etmek için tabanı (object?) out parametresiyle setup'lıyoruz:
            object? cachedValue = null;
            _memoryCacheMock
                .Setup(m => m.TryGetValue(It.IsAny<object>(), out cachedValue))
                .Returns(false); // Önbellekte yok varsayıyoruz ki repository'e gitsin

            var cacheEntryMock = new Mock<ICacheEntry>();
            _memoryCacheMock
                .Setup(m => m.CreateEntry(It.IsAny<object>()))
                .Returns(cacheEntryMock.Object);

            _universityRepoMock.Setup(r => r.GetAllAsync(It.IsAny<System.Linq.Expressions.Expression<Func<University, bool>>>()))
                .ReturnsAsync(universities);

            _mapperMock.Setup(m => m.Map<List<UniversityLookupResponse>>(It.IsAny<IEnumerable<University>>()))
                .Returns(expectedResponse);

            // Act
            var result = await _universityService.GetAllUniversitiesAsync();

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(1);
            result[0].Name.Should().Be("Zonguldak Bülent Ecevit Üniversitesi");
        }

        // ==========================================
        // 2. TESTS FOR GetFacultiesByUniversityIdAsync
        // ==========================================
        [Fact]
        public async Task GetFacultiesByUniversityIdAsync_ShouldReturnFacultiesForUniversity()
        {
            // Arrange
            var universityId = Guid.NewGuid();
            var faculties = new List<Faculty>
            {
                new Faculty { Id = Guid.NewGuid(), UniversityId = universityId, Name = "Mühendislik Fakültesi", IsActive = true }
            };
            var expectedResponse = new List<FacultyLookupResponse>
            {
                new FacultyLookupResponse { Id = faculties[0].Id, Name = "Mühendislik Fakültesi" }
            };

            object? cachedValue = null;
            _memoryCacheMock
                .Setup(m => m.TryGetValue(It.IsAny<object>(), out cachedValue))
                .Returns(false);

            var cacheEntryMock = new Mock<ICacheEntry>();
            _memoryCacheMock
                .Setup(m => m.CreateEntry(It.IsAny<object>()))
                .Returns(cacheEntryMock.Object);

            _facultyRepoMock.Setup(r => r.GetAllAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Faculty, bool>>>()))
                .ReturnsAsync(faculties);

            _mapperMock.Setup(m => m.Map<List<FacultyLookupResponse>>(It.IsAny<IEnumerable<Faculty>>()))
                .Returns(expectedResponse);

            // Act
            var result = await _universityService.GetFacultiesByUniversityIdAsync(universityId);

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(1);
            result[0].Name.Should().Be("Mühendislik Fakültesi");
        }

        // ==========================================
        // 3. TESTS FOR GetDepartmentsByFacultyIdAsync
        // ==========================================
        [Fact]
        public async Task GetDepartmentsByFacultyIdAsync_ShouldReturnDepartmentsForFaculty()
        {
            // Arrange
            var facultyId = Guid.NewGuid();
            var departments = new List<Department>
            {
                new Department { Id = Guid.NewGuid(), FacultyId = facultyId, Name = "Bilgisayar Mühendisliği", IsActive = true }
            };
            var expectedResponse = new List<DepartmentLookupResponse>
            {
                new DepartmentLookupResponse { Id = departments[0].Id, Name = "Bilgisayar Mühendisliği" }
            };

            object? cachedValue = null;
            _memoryCacheMock
                .Setup(m => m.TryGetValue(It.IsAny<object>(), out cachedValue))
                .Returns(false);

            var cacheEntryMock = new Mock<ICacheEntry>();
            _memoryCacheMock
                .Setup(m => m.CreateEntry(It.IsAny<object>()))
                .Returns(cacheEntryMock.Object);

            _departmentRepoMock.Setup(r => r.GetAllAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Department, bool>>>()))
                .ReturnsAsync(departments);

            _mapperMock.Setup(m => m.Map<List<DepartmentLookupResponse>>(It.IsAny<IEnumerable<Department>>()))
                .Returns(expectedResponse);

            // Act
            var result = await _universityService.GetDepartmentsByFacultyIdAsync(facultyId);

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(1);
            result[0].Name.Should().Be("Bilgisayar Mühendisliği");
        }
    }
}