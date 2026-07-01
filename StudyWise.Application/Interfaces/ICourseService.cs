using StudyWise.Application.DTOs.Courses;

namespace StudyWise.Application.Interfaces;

public interface ICourseService
{
    Task<IEnumerable<CourseDto>> GetAllAsync(Guid userId);
    Task<CourseDto?> GetByIdAsync(int id, Guid userId);
    Task<CourseDto> CreateAsync(CreateCourseDto dto, Guid userId);
    Task<CourseDto?> UpdateAsync(int id, UpdateCourseDto dto, Guid userId);
    Task<bool> DeleteAsync(int id, Guid userId);
}