namespace StudyWise.API.Models;

public class ExamEvent
{
    public int Id { get; set; }
    public int CourseId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public DateOnly EventDate { get; set; }
    public string EventType { get; set; } = "Exam"; // "Exam" | "Quiz" | "Assignment"
    public bool IsProtected { get; set; } = true;

    public Course Course { get; set; } = null!;
    public ApplicationUser User { get; set; } = null!;
}