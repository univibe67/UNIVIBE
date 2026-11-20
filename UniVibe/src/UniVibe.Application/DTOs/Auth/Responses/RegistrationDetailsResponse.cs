namespace UniVibe.Application.DTOs.Auth.Responses
{
    public class RegistrationDetailsResponse
    {
        public Guid UniversityId { get; set; }
        public string UniversityName { get; set; } = string.Empty;
        public Guid FacultyId { get; set; }
        public string FacultyName { get; set; } = string.Empty;
        public bool IsAcademicEmail { get; set; }
        public string? Title { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }

        public RegistrationDetailsResponse() { }

        public RegistrationDetailsResponse(
            Guid universityId,
            string universityName,
            Guid facultyId,
            string facultyName,
            bool isAcademicEmail = false,
            string? title = null,
            string? firstName = null,
            string? lastName = null)
        {
            UniversityId = universityId;
            UniversityName = universityName;
            FacultyId = facultyId;
            FacultyName = facultyName;
            IsAcademicEmail = isAcademicEmail;
            Title = title;
            FirstName = firstName;
            LastName = lastName;
        }
    }
}