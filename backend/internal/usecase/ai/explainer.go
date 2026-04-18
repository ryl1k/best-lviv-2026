package ai

import (
	"context"
	"fmt"
	"strings"

	openai "github.com/sashabaranov/go-openai"
	"github.com/ryl1k/best-lviv-2026/internal/entity"
)

type Explainer struct {
	client *openai.Client
}

func NewExplainer(apiKey string) *Explainer {
	return &Explainer{client: openai.NewClient(apiKey)}
}

func (e *Explainer) ExplainDiscrepancy(ctx context.Context, d entity.Discrepancy) (string, error) {
	prompt := buildPrompt(d)

	resp, err := e.client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model: openai.GPT4oMini,
		Messages: []openai.ChatCompletionMessage{
			{
				Role: openai.ChatMessageRoleSystem,
				Content: `Ти — аналітик земельного реєстру для муніципальних службовців України.
Звертайся безпосередньо до власника (використовуй його ім'я з даних).
Пояснюй виявлені розбіжності простою, зрозумілою українською мовою.
Відповідай коротко (2-4 речення). Не використовуй юридичний жаргон.
Поясни власнику: що саме не так з його записами, чому це потребує уваги, та що йому варто зробити.`,
			},
			{
				Role:    openai.ChatMessageRoleUser,
				Content: prompt,
			},
		},
		MaxTokens:   300,
		Temperature: 0.3,
	})
	if err != nil {
		return "", fmt.Errorf("openai: %w", err)
	}

	return strings.TrimSpace(resp.Choices[0].Message.Content), nil
}

func buildPrompt(d entity.Discrepancy) string {
	var sb strings.Builder

	sb.WriteString(fmt.Sprintf("Власник: %s (ІПН: %s)\n", d.OwnerName, d.TaxID))
	sb.WriteString(fmt.Sprintf("Виявлена проблема: %s\n", d.Description))
	sb.WriteString(fmt.Sprintf("Правило: %s, Серйозність: %s, Ризик-бал: %d\n", d.RuleCode, d.Severity, d.RiskScore))

	if len(d.Details) > 0 {
		sb.WriteString("Деталі:\n")
		for k, v := range d.Details {
			sb.WriteString(fmt.Sprintf("  %s: %v\n", k, v))
		}
	}

	sb.WriteString("\nПоясни цю розбіжність муніципальному службовцю.")
	return sb.String()
}
