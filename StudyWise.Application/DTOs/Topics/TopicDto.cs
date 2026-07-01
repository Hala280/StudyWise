namespace StudyWise.Application.DTOs.Topics;

public class TopicDto
{
    public int Id { get; set; }
    public int CourseId { get; set; }
    public string Title { get; set; } = string.Empty;
    public int EstimatedHours { get; set; }
    public int OrderIndex { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime CreatedAt { get; set; }
}