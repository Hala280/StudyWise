using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Configuration;

namespace StudyWise.Infrastructure.Parsing;

public class ParsedTopic
{
    public string Title { get; set; } = string.Empty;
    public int EstimatedHours { get; set; }
    public int OrderIndex { get; set; }
}

public class GeminiSyllabusParser
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly string _model;

    public GeminiSyllabusParser(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _apiKey = configuration["Gemini:ApiKey"]!;
        _model = configuration["Gemini:Model"]!;
    }

    public async Task<List<ParsedTopic>> ParseAsync(string syllabusText)
    {
        var prompt = $"""
            You are a study planner assistant. Extract all topics/chapters from this syllabus.
            Return ONLY a valid JSON array with no extra text, no markdown, no code blocks.
            Each item must have: title (string), estimatedHours (int), orderIndex (int starting from 1).

            Syllabus:
            {syllabusText}
            """;

        var requestBody = new
        {
            contents = new[]
            {
                new
                {
                    parts = new[]
                    {
                        new { text = prompt }
                    }
                }
            }
        };

        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{_model}:generateContent?key={_apiKey}";
        HttpResponseMessage? response = null;

        const int maxAttempts = 3;
        for (var attempt = 1; attempt <= maxAttempts; attempt++)
        {
            try
            {
                response = await _httpClient.PostAsJsonAsync(url, requestBody);
            }
            catch (HttpRequestException ex)
            {
                // Some HttpClient pipelines (e.g. Polly / resilience handlers) throw
                // instead of returning the response, surfacing the status code on the exception.
                if (ex.StatusCode == System.Net.HttpStatusCode.TooManyRequests && attempt < maxAttempts)
                {
                    await Task.Delay(TimeSpan.FromSeconds(2 * attempt));
                    continue;
                }

                return ParseLocally(syllabusText);
            }

            if (response.StatusCode == System.Net.HttpStatusCode.TooManyRequests && attempt < maxAttempts)
            {
                await Task.Delay(TimeSpan.FromSeconds(2 * attempt));
                continue;
            }

            break;
        }

        if (response is null || !response.IsSuccessStatusCode)
        {
            return ParseLocally(syllabusText);
        }

        var result = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(result);

        var rawText = json
            .RootElement
            .GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("text")
            .GetString() ?? "[]";

        rawText = rawText.Trim().TrimStart('`');
        if (rawText.StartsWith("json")) rawText = rawText[4..];
        rawText = rawText.TrimEnd('`').Trim();

        var parsed = JsonSerializer.Deserialize<List<ParsedTopic>>(rawText, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        }) ?? new List<ParsedTopic>();

        return parsed.Count > 0 ? parsed : ParseLocally(syllabusText);
    }

    private static List<ParsedTopic> ParseLocally(string syllabusText)
    {
        var topics = new List<string>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var rawLine in syllabusText.Split('\n'))
        {
            var line = CleanLine(rawLine);
            if (!LooksLikeTopic(line)) continue;

            var title = NormalizeTitle(line);
            if (title.Length < 4 || title.Length > 120) continue;
            if (!seen.Add(title)) continue;

            topics.Add(title);
            if (topics.Count >= 20) break;
        }

        if (topics.Count == 0)
        {
            topics = syllabusText
                .Split('.', '\n')
                .Select(CleanLine)
                .Where(line => line.Length is >= 8 and <= 120)
                .Where(line => !IsAdministrativeLine(line))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Take(12)
                .ToList();
        }

        return topics
            .Select((title, index) => new ParsedTopic
            {
                Title = title,
                EstimatedHours = 1,
                OrderIndex = index + 1
            })
            .ToList();
    }

    private static bool LooksLikeTopic(string line)
    {
        if (string.IsNullOrWhiteSpace(line) || IsAdministrativeLine(line)) return false;

        return Regex.IsMatch(
            line,
            @"\b(chapter|unit|module|week|topic|lecture|lesson|section|part)\b|^\d+[\.\)]\s+|^[IVXLCDM]+[\.\)]\s+",
            RegexOptions.IgnoreCase);
    }

    private static bool IsAdministrativeLine(string line)
    {
        return Regex.IsMatch(
            line,
            @"\b(email|office hours|grading|attendance|policy|policies|required text|textbook|assignment|exam date|instructor|professor|credits?)\b",
            RegexOptions.IgnoreCase);
    }

    private static string CleanLine(string line)
    {
        return Regex.Replace(line.Trim(), @"\s+", " ");
    }

    private static string NormalizeTitle(string line)
    {
        var title = Regex.Replace(line, @"^[-*•\s]+", "");
        title = Regex.Replace(title, @"^(week|unit|module|chapter|topic|lecture|lesson|section)\s+\d+\s*[:\-–]\s*", "", RegexOptions.IgnoreCase);
        title = Regex.Replace(title, @"^\d+[\.\)]\s*", "");
        title = Regex.Replace(title, @"^[IVXLCDM]+[\.\)]\s*", "", RegexOptions.IgnoreCase);
        return CleanLine(title);
    }
}