namespace UniVibe.Application.DTOs.Auth.Responses
{
    public class RegistrationDetailsResponse
    {
        public Guid UniversityId { get; set; }
        public string UniversityName { get; set; } = string.Empty;
        public Guid FacultyId { get; set; }       
        public string FacultyName { get; set; } = string.Empty;

        public RegistrationDetailsResponse() { }

        public RegistrationDetailsResponse(Guid universityId, string universityName, Guid facultyId, string facultyName)
        {
            UniversityId = universityId;
            UniversityName = universityName;
            FacultyId = facultyId;
            FacultyName = facultyName;
        }
    }
}