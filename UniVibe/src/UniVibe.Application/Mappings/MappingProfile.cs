using AutoMapper;
using System.Linq;
using UniVibe.Application.DTOs.Event.Requests;
using UniVibe.Application.DTOs.Event.Responses;
using UniVibe.Application.DTOs.Feedback.Response;
using UniVibe.Application.DTOs.Message.Responses;
using UniVibe.Application.DTOs.University.Responses;
using UniVibe.Application.DTOs.User.Responses;
using UniVibe.Domain.Entities;

namespace UniVibe.Application.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<University, UniversityLookupResponse>();
            CreateMap<Faculty, FacultyLookupResponse>();
            CreateMap<Department, DepartmentLookupResponse>();

            CreateMap<CreateEventRequest, Event>();

            CreateMap<EventMessage, EventMessageResponse>()
                .ForMember(dest => dest.SenderName, opt => opt.MapFrom(src => src.User != null ? $"{src.User.FirstName} {src.User.LastName}" : "Unknown"))
                .ForMember(dest => dest.SenderProfileImage, opt => opt.MapFrom(src => src.User != null ? src.User.ProfilePictureUrl : null));

            CreateMap<Event, EventDetailResponse>()
                .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.UserId))
                .ForMember(dest => dest.CreatorName, opt => opt.MapFrom(src => src.User != null ? $"{src.User.FirstName} {src.User.LastName}" : string.Empty))
                .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category != null ? src.Category.Name : string.Empty))
                .ForMember(dest => dest.ParticipantCount, opt => opt.MapFrom(src => src.Attendees != null ? src.Attendees.Count(a => !a.IsDeleted) : 0))
                .ForMember(dest => dest.Department, opt => opt.MapFrom(src => src.User != null && src.User.Department != null ? src.User.Department.Name : null))
                .ForMember(dest => dest.Grade, opt => opt.MapFrom(src => src.User != null ? src.User.Grade : null));

            CreateMap<User, UserProfileResponse>()
                .ForMember(dest => dest.Department, opt => opt.MapFrom(src => src.Department != null ? src.Department.Name : null))
                .ForMember(dest => dest.Faculty, opt => opt.MapFrom(src => src.Department != null && src.Department.Faculty != null ? src.Department.Faculty.Name : null))
                .ForMember(dest => dest.University, opt => opt.MapFrom(src => src.Department != null && src.Department.Faculty != null && src.Department.Faculty.University != null ? src.Department.Faculty.University.Name : null));

            CreateMap<User, PublicUserProfileResponse>()
                .ForMember(dest => dest.University, opt => opt.MapFrom(src =>src.Department != null && src.Department.Faculty != null && src.Department.Faculty.University != null ? src.Department.Faculty.University.Name: null))
                .ForMember(dest => dest.Department, opt => opt.MapFrom(src => src.Department != null ? src.Department.Name : null))
                .ForMember(dest => dest.Faculty, opt => opt.MapFrom(src => src.Department != null && src.Department.Faculty != null ? src.Department.Faculty.Name : null));

            CreateMap<User, ParticipantResponse>();

            CreateMap<User, UserListResponse>()
                .ForMember(dest => dest.DepartmentName, opt => opt.MapFrom(src => src.Department != null ? src.Department.Name : null))
                .ForMember(dest => dest.FacultyName, opt => opt.MapFrom(src => src.Department != null && src.Department.Faculty != null ? src.Department.Faculty.Name : null));

            CreateMap<Event, EventListResponse>()
                .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.UserId))
                .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category != null ? src.Category.Name : string.Empty))
                .ForMember(dest => dest.OrganizerName, opt => opt.MapFrom(src => src.User != null ? $"{src.User.FirstName} {src.User.LastName}" : string.Empty))
                .ForMember(dest => dest.ParticipantCount, opt => opt.MapFrom(src => src.Attendees != null ? src.Attendees.Count(a => !a.IsDeleted) : 0));

            CreateMap<Feedback, FeedbackResponseDto>()
                .ForMember(dest => dest.UserFullName, opt => opt.MapFrom(src => src.User != null ? $"{src.User.FirstName} {src.User.LastName}" : "Unknown"));
        }
    }
}