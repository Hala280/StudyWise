namespace StudyWise.Application.DTOs.Topics;

public class CreateTopicDto
{
    public string Title { get; set; } = string.Empty;
    public int EstimatedHours { get; set; }
    public int OrderIndex { get; set; }
}