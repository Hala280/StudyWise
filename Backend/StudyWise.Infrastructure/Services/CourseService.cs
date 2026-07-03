using Microsoft.EntityFrameworkCore;
using StudyWise.Application.DTOs.Courses;
using StudyWise.Application.Interfaces;
using StudyWise.Domain.Entities;
using StudyWise.Infrastructure.Persistence;

namespace StudyWise.Infrastructure.Services;

public class CourseService : ICourseService
{
    private readonly StudyWiseDbContext _context;

    public CourseService(StudyWiseDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<CourseDto>> GetAllAsync(Guid userId)
    {
        return await _context.Courses
            .Where(c => c.UserId == userId)
            .Select(c => new CourseDto
            {
                Id = c.Id,
                Title = c.Title,
                Description = c.Description,
                ExamDate = c.ExamDate,
                EstimatedTotalHours = c.EstimatedTotalHours,
                CreatedAt = c.CreatedAt,
                TopicsCount = c.Topics.Count
            })
            .ToListAsync();
    }

    public async Task<CourseDto?> GetByIdAsync(int id, Guid userId)
    {
        return await _context.Courses
            .Where(c => c.Id == id && c.UserId == userId)
            .Select(c => new CourseDto
            {
                Id = c.Id,
                Title = c.Title,
                Description = c.Description,
                ExamDate = c.ExamDate,
                EstimatedTotalHours = c.EstimatedTotalHours,
                CreatedAt = c.CreatedAt,
                TopicsCount = c.Topics.Count
            })
            .FirstOrDefaultAsync();
    }

    public async Task<CourseDto> CreateAsync(CreateCourseDto dto, Guid userId)
    {
        var course = new Course
        {
            UserId = userId,
            Title = dto.Title,
            Description = dto.Description,
            ExamDate = dto.ExamDate,
            EstimatedTotalHours = dto.EstimatedTotalHours,
            CreatedAt = DateTime.UtcNow
        };

        _context.Courses.Add(course);
        await _context.SaveChangesAsync();

        return new CourseDto
        {
            Id = course.Id,
            Title = course.Title,
            Description = course.Description,
            ExamDate = course.ExamDate,
            EstimatedTotalHours = course.EstimatedTotalHours,
            CreatedAt = course.CreatedAt,
            TopicsCount = 0
        };
    }

    public async Task<CourseDto?> UpdateAsync(int id, UpdateCourseDto dto, Guid userId)
    {
        var course = await _context.Courses
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

        if (course is null) return null;

        course.Title = dto.Title;
        course.Description = dto.Description;
        course.ExamDate = dto.ExamDate;
        course.EstimatedTotalHours = dto.EstimatedTotalHours;

        await _context.SaveChangesAsync();

        return new CourseDto
        {
            Id = course.Id,
            Title = course.Title,
            Description = course.Description,
            ExamDate = course.ExamDate,
            EstimatedTotalHours = course.EstimatedTotalHours,
            CreatedAt = course.CreatedAt,
            TopicsCount = 0
        };
    }

    public async Task<bool> DeleteAsync(int id, Guid userId)
    {
        var course = await _context.Courses
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

        if (course is null) return false;

        _context.Courses.Remove(course);
        await _context.SaveChangesAsync();
        return true;
    }
}