namespace StudyWise.Domain.Entities;

public class ExamEvent
{
    public int Id { get; set; }
    public int CourseId { get; set; }
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateOnly EventDate { get; set; }
    public string EventType { get; set; } = string.Empty;
    public bool IsProtected { get; set; } = true;

    // Navigation
    public Course Course { get; set; } = null!;
}