using Microsoft.EntityFrameworkCore;
using StudyWise.Application.DTOs.Topics;
using StudyWise.Application.Interfaces;
using StudyWise.Domain.Entities;
using StudyWise.Infrastructure.Persistence;

namespace StudyWise.Infrastructure.Services;

public class TopicService : ITopicService
{
    private readonly StudyWiseDbContext _context;

    public TopicService(StudyWiseDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<TopicDto>> GetByCourseAsync(int courseId, Guid userId)
    {
        return await _context.Topics
            .Where(t => t.CourseId == courseId && t.Course.UserId == userId)
            .OrderBy(t => t.OrderIndex)
            .Select(t => new TopicDto
            {
                Id = t.Id,
                CourseId = t.CourseId,
                Title = t.Title,
                EstimatedHours = t.EstimatedHours,
                OrderIndex = t.OrderIndex,
                IsCompleted = t.IsCompleted,
                CreatedAt = t.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<TopicDto?> GetByIdAsync(int id, Guid userId)
    {
        return await _context.Topics
            .Where(t => t.Id == id && t.Course.UserId == userId)
            .Select(t => new TopicDto
            {
                Id = t.Id,
                CourseId = t.CourseId,
                Title = t.Title,
                EstimatedHours = t.EstimatedHours,
                OrderIndex = t.OrderIndex,
                IsCompleted = t.IsCompleted,
                CreatedAt = t.CreatedAt
            })
            .FirstOrDefaultAsync();
    }

    public async Task<TopicDto> CreateAsync(int courseId, CreateTopicDto dto, Guid userId)
    {
        var topic = new Topic
        {
            CourseId = courseId,
            Title = dto.Title,
            EstimatedHours = dto.EstimatedHours,
            OrderIndex = dto.OrderIndex,
            IsCompleted = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.Topics.Add(topic);
        await _context.SaveChangesAsync();

        return new TopicDto
        {
            Id = topic.Id,
            CourseId = topic.CourseId,
            Title = topic.Title,
            EstimatedHours = topic.EstimatedHours,
            OrderIndex = topic.OrderIndex,
            IsCompleted = topic.IsCompleted,
            CreatedAt = topic.CreatedAt
        };
    }

    public async Task<TopicDto?> UpdateAsync(int id, UpdateTopicDto dto, Guid userId)
    {
        var topic = await _context.Topics
            .Include(t => t.Course)
            .FirstOrDefaultAsync(t => t.Id == id && t.Course.UserId == userId);

        if (topic is null) return null;

        topic.Title = dto.Title;
        topic.EstimatedHours = dto.EstimatedHours;
        topic.OrderIndex = dto.OrderIndex;
        topic.IsCompleted = dto.IsCompleted;

        await _context.SaveChangesAsync();

        return new TopicDto
        {
            Id = topic.Id,
            CourseId = topic.CourseId,
            Title = topic.Title,
            EstimatedHours = topic.EstimatedHours,
            OrderIndex = topic.OrderIndex,
            IsCompleted = topic.IsCompleted,
            CreatedAt = topic.CreatedAt
        };
    }

    public async Task<bool> DeleteAsync(int id, Guid userId)
    {
        var topic = await _context.Topics
            .Include(t => t.Course)
            .FirstOrDefaultAsync(t => t.Id == id && t.Course.UserId == userId);

        if (topic is null) return false;

        _context.Topics.Remove(topic);
        await _context.SaveChangesAsync();
        return true;
    }
}