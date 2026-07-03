namespace StudyWise.Domain.Entities;

public class Course
{
    public int Id { get; set; }
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? ExamDate { get; set; }
    public int EstimatedTotalHours { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<Topic> Topics { get; set; } = new List<Topic>();
    public ICollection<ExamEvent> ExamEvents { get; set; } = new List<ExamEvent>();
}