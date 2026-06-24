using iText.Kernel.Pdf;
using iText.Kernel.Pdf.Canvas.Parser;

namespace StudyWise.Infrastructure.Parsing;

public static class PdfTextExtractor
{
    public static string ExtractText(Stream pdfStream)
    {
        var text = new System.Text.StringBuilder();

        using var reader = new PdfReader(pdfStream);
        using var document = new PdfDocument(reader);

        for (int i = 1; i <= document.GetNumberOfPages(); i++)
        {
            var page = document.GetPage(i);
            text.AppendLine(PdfTextExtractor.GetTextFromPage(page));
        }

        return text.ToString();
    }

    private static string GetTextFromPage(iText.Kernel.Pdf.PdfPage page)
    {
        return iText.Kernel.Pdf.Canvas.Parser.PdfTextExtractor.GetTextFromPage(page);
    }
}