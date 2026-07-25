using AutoMapper;
using UniVibe.Application.DTOs.Event.Requests;
using UniVibe.Application.DTOs.Event.Responses;
using UniVibe.Application.DTOs.University.Responses;
using UniVibe.Application.DTOs.User.Responses;
using UniVibe.Domain.Entities;

namespace UniVibe.Application.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // University Mappings
            CreateMap<University, UniversityLookupResponse>();
            CreateMap<Faculty, FacultyLookupResponse>();
            CreateMap<Department, DepartmentLookupResponse>();

            // Event Mappings
            CreateMap<CreateEventRequest, Event>();
            CreateMap<EventCategory, EventCategoryResponse>();

            CreateMap<Event, EventDetailResponse>()
                .ForMember(dest => dest.ParticipantCount, opt => opt.MapFrom(src => src.Attendees.Count));

            // User Mappings
            CreateMap<User, UserProfileResponse>()
                .ForMember(dest => dest.DepartmentName, opt => opt.MapFrom(src => src.Department.Name))
                .ForMember(dest => dest.FacultyName, opt => opt.MapFrom(src => src.Department.Faculty.Name))
                .ForMember(dest => dest.UniversityName, opt => opt.MapFrom(src => src.Department.Faculty.University.Name));

            CreateMap<User, PublicUserProfileResponse>()
                .ForMember(dest => dest.Department, opt => opt.MapFrom(src => src.Department.Name))
                .ForMember(dest => dest.Faculty, opt => opt.MapFrom(src => src.Department.Faculty.Name));

            CreateMap<User, ParticipantResponse>();

            // Admin & List Mappings
            CreateMap<User, UserListResponse>();

            CreateMap<Event, EventListResponse>()
                .ForMember(dest => dest.OrganizerName, opt => opt.MapFrom(src => src.User.FirstName + " " + src.User.LastName))
                .ForMember(dest => dest.ParticipantCount, opt => opt.MapFrom(src => src.Attendees.Count));
        }
    }
}