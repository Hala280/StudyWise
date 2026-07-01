namespace StudyWise.API.Models;

public class Course
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? ExamDate { get; set; }
    public int EstimatedTotalHours { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ApplicationUser User { get; set; } = null!;
    public ICollection<Topic> Topics { get; set; } = new List<Topic>();
    public ICollection<ExamEvent> ExamEvents { get; set; } = new List<ExamEvent>();
}