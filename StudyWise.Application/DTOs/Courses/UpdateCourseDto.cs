namespace StudyWise.Application.DTOs.Courses;

public class UpdateCourseDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? ExamDate { get; set; }
    public int EstimatedTotalHours { get; set; }
}