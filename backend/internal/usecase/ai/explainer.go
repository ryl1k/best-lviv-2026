package ai

import (
	"context"
	"fmt"
	"strings"

	"github.com/ryl1k/best-lviv-2026/internal/entity"
	openai "github.com/sashabaranov/go-openai"
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
Відповідай коротко (3-5 речень). Не використовуй юридичний жаргон.
Поясни власнику: що саме не так з його записами, чому це потребує уваги, та що йому варто зробити.

Обов'язково вкажи правову підставу виявленої розбіжності — конкретний закон та статтю (наприклад: «відповідно до ст. 20 Земельного кодексу України» або «згідно із Законом України «Про державну реєстрацію речових прав на нерухоме майно та їх обтяжень»»).
Нагадай, що система є виключно аналітичним інструментом і не вносить змін до реєстрів — право власності залишається захищеним відповідно до ст. 41 Конституції України та ст. 316–321 Цивільного кодексу України до завершення офіційної перевірки.

Правові підстави за кодом правила:
- R01_TERMINATED_STILL_HAS_LAND: ЗУ «Про державну реєстрацію речових прав на нерухоме майно та їх обтяжень», ст. 4; Земельний кодекс України, ст. 126
- R02_PURPOSE_MISMATCH: Земельний кодекс України, ст. 20 (цільове призначення земель)
- R03_LAND_WITHOUT_ESTATE: Земельний кодекс України, ст. 126; ЗУ «Про державну реєстрацію речових прав», ст. 4
- R04_INVALID_TAX_ID: Податковий кодекс України, ст. 63; ЗУ «Про державну реєстрацію юридичних осіб та фізичних осіб-підприємців»
- R05_DUPLICATE: ЗУ «Про Державний земельний кадастр», ст. 15; Земельний кодекс України, ст. 79
- R06_NAME_MISMATCH: ЗУ «Про державну реєстрацію речових прав на нерухоме майно та їх обтяжень», ст. 18
- R07_INCOMPLETE: ЗУ «Про Державний земельний кадастр», ст. 15; ЗУ «Про державну реєстрацію речових прав», ст. 14`,
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

	fmt.Fprintf(&sb, "Власник: %s (ІПН: %s)\n", d.OwnerName, d.TaxID)
	fmt.Fprintf(&sb, "Виявлена проблема: %s\n", d.Description)
	fmt.Fprintf(&sb, "Правило: %s, Серйозність: %s, Ризик-бал: %d\n", d.RuleCode, d.Severity, d.RiskScore)

	if len(d.Details) > 0 {
		sb.WriteString("Деталі:\n")
		for k, v := range d.Details {
			fmt.Fprintf(&sb, "  %s: %v\n", k, v)
		}
	}

	sb.WriteString("\nПоясни цю розбіжність муніципальному службовцю.")
	return sb.String()
}
