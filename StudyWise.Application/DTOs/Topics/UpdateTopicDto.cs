namespace StudyWise.Application.DTOs.Topics;

public class UpdateTopicDto
{
    public string Title { get; set; } = string.Empty;
    public int EstimatedHours { get; set; }
    public int OrderIndex { get; set; }
    public bool IsCompleted { get; set; }
}