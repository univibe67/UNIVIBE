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
            CreateMap<User, UserProfileResponse>();
            CreateMap<User, PublicUserProfileResponse>();
        }
    }
}
