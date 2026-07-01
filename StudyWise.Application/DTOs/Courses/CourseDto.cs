namespace StudyWise.Application.DTOs.Courses;

public class CourseDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? ExamDate { get; set; }
    public int EstimatedTotalHours { get; set; }
    public DateTime CreatedAt { get; set; }
    public int TopicsCount { get; set; }
}