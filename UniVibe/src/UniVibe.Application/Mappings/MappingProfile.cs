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

            //Event Mappings
            CreateMap<CreateEventRequest, Event>();
            CreateMap<Event, EventDetailResponse>();
            CreateMap<EventCategory, EventCategoryResponse>();

            // User Mappings
            CreateMap<User, UserProfileResponse>()
                .ForMember(dest => dest.DepartmentName, opt => opt.MapFrom(src => src.Department.Name))
                .ForMember(dest => dest.FacultyName, opt => opt.MapFrom(src => src.Department.Faculty.Name))
                .ForMember(dest => dest.UniversityName, opt => opt.MapFrom(src => src.Department.Faculty.University.Name));

            CreateMap<User, PublicUserProfileResponse>()
                .ForMember(dest => dest.Department, opt => opt.MapFrom(src => src.Department.Name))
                .ForMember(dest => dest.Faculty, opt => opt.MapFrom(src => src.Department.Faculty.Name));
            // Adim Mapping
            CreateMap<User, UserListResponse>();
            CreateMap<Event, EventListResponse>()
                .ForMember(dest => dest.OrganizerName, opt => opt.MapFrom(src => src.User.FirstName + " " + src.User.LastName)); ;
        }
    }
}
