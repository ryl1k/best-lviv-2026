package v1

import (
	"io"
	"log/slog"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strconv"

	"github.com/google/uuid"
	"github.com/labstack/echo/v5"
	"github.com/ryl1k/best-lviv-2026/internal/dto/httpresponse"
	"github.com/ryl1k/best-lviv-2026/internal/entity"
	"github.com/ryl1k/best-lviv-2026/internal/repo"
	"github.com/ryl1k/best-lviv-2026/internal/usecase"
)

type AuditController struct {
	logger  *slog.Logger
	useCase usecase.AuditUseCase
}

func NewAuditController(logger *slog.Logger, useCase usecase.AuditUseCase) *AuditController {
	return &AuditController{logger: logger, useCase: useCase}
}

// Upload godoc
// @Summary      Upload registry files for audit
// @Tags         audits
// @Accept       multipart/form-data
// @Produce      json
// @Param        land_file   formData  file  true  "Land registry file (.xlsx or .csv)"
// @Param        estate_file formData  file  true  "Estate registry file (.xlsx or .csv)"
// @Success      202  {object}  httpresponse.Response{data=httpresponse.UploadTaskResponse}
// @Failure      400  {object}  httpresponse.Response
// @Failure      500  {object}  httpresponse.Response
// @Router       /v1/audits/upload [post]
func (c *AuditController) Upload(ctx *echo.Context) error {
	landFile, err := ctx.FormFile("land_file")
	if err != nil {
		return httpresponse.NewErrorResponse(ctx, entity.ErrBadRequest, "land_file is required")
	}
	estateFile, err := ctx.FormFile("estate_file")
	if err != nil {
		return httpresponse.NewErrorResponse(ctx, entity.ErrBadRequest, "estate_file is required")
	}

	landData, err := readMultipartFile(landFile)
	if err != nil {
		return httpresponse.NewErrorResponse(ctx, entity.ErrBadRequest, "failed to read land_file")
	}
	estateData, err := readMultipartFile(estateFile)
	if err != nil {
		return httpresponse.NewErrorResponse(ctx, entity.ErrBadRequest, "failed to read estate_file")
	}

	landExt := filepath.Ext(landFile.Filename)
	estateExt := filepath.Ext(estateFile.Filename)

	taskID, err := c.useCase.Upload(ctx.Request().Context(), landData, estateData, landExt, estateExt)
	if err != nil {
		c.logger.Error("upload failed", "error", err)
		return httpresponse.NewErrorResponse(ctx, err)
	}

	return ctx.JSON(http.StatusAccepted, &httpresponse.Response{
		Data: httpresponse.UploadTaskResponse{TaskID: taskID},
		Metadata: httpresponse.ResponseMetadata{
			StatusCode: http.StatusAccepted,
		},
	})
}

// GetTask godoc
// @Summary      Get task status and stats
// @Tags         tasks
// @Produce      json
// @Param        id  path  string  true  "Task UUID"
// @Success      200  {object}  httpresponse.Response{data=httpresponse.TaskResponse}
// @Failure      404  {object}  httpresponse.Response
// @Router       /v1/tasks/{id} [get]
func (c *AuditController) GetTask(ctx *echo.Context) error {
	taskID, err := parseUUIDParam(ctx, "id")
	if err != nil {
		return httpresponse.NewErrorResponse(ctx, entity.ErrBadRequest, "invalid task id")
	}

	task, err := c.useCase.GetTask(ctx.Request().Context(), taskID)
	if err != nil {
		return httpresponse.NewErrorResponse(ctx, err)
	}

	return httpresponse.NewSuccessResponse(ctx, httpresponse.TaskToResponse(task), http.StatusOK)
}

// GetResults godoc
// @Summary      Get paginated discrepancies for a task
// @Tags         tasks
// @Produce      json
// @Param        id                path   string  true   "Task UUID"
// @Param        severity          query  string  false  "Filter by severity (LOW|MEDIUM|HIGH)"
// @Param        rule_code         query  string  false  "Filter by rule code"
// @Param        resolution_status query  string  false  "Filter by resolution status"
// @Param        tax_id            query  string  false  "Filter by tax ID"
// @Param        search            query  string  false  "Search in owner name or description"
// @Param        page              query  int     false  "Page number (default 1)"
// @Param        page_size         query  int     false  "Page size (default 50)"
// @Success      200  {object}  httpresponse.Response{data=httpresponse.PaginatedDiscrepanciesResponse}
// @Failure      404  {object}  httpresponse.Response
// @Router       /v1/tasks/{id}/results [get]
func (c *AuditController) GetResults(ctx *echo.Context) error {
	taskID, err := parseUUIDParam(ctx, "id")
	if err != nil {
		return httpresponse.NewErrorResponse(ctx, entity.ErrBadRequest, "invalid task id")
	}

	filter := repo.DiscrepancyFilter{
		Severity:         ctx.QueryParam("severity"),
		RuleCode:         ctx.QueryParam("rule_code"),
		ResolutionStatus: ctx.QueryParam("resolution_status"),
		TaxID:            ctx.QueryParam("tax_id"),
		Search:           ctx.QueryParam("search"),
	}
	filter.Page, _ = strconv.Atoi(ctx.QueryParam("page"))
	filter.PageSize, _ = strconv.Atoi(ctx.QueryParam("page_size"))

	items, total, err := c.useCase.GetResults(ctx.Request().Context(), taskID, filter)
	if err != nil {
		return httpresponse.NewErrorResponse(ctx, err)
	}

	responses := make([]httpresponse.DiscrepancyResponse, 0, len(items))
	for _, d := range items {
		responses = append(responses, httpresponse.DiscrepancyToResponse(d))
	}

	page := filter.Page
	if page <= 0 {
		page = 1
	}
	pageSize := filter.PageSize
	if pageSize <= 0 {
		pageSize = 50
	}

	return httpresponse.NewSuccessResponse(ctx, httpresponse.PaginatedDiscrepanciesResponse{
		Items:    responses,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	}, http.StatusOK)
}

// GetSummary godoc
// @Summary      Get discrepancy summary for a task
// @Tags         tasks
// @Produce      json
// @Param        id  path  string  true  "Task UUID"
// @Success      200  {object}  httpresponse.Response{data=httpresponse.SummaryResponse}
// @Failure      404  {object}  httpresponse.Response
// @Router       /v1/tasks/{id}/results/summary [get]
func (c *AuditController) GetSummary(ctx *echo.Context) error {
	taskID, err := parseUUIDParam(ctx, "id")
	if err != nil {
		return httpresponse.NewErrorResponse(ctx, entity.ErrBadRequest, "invalid task id")
	}

	summary, err := c.useCase.GetSummary(ctx.Request().Context(), taskID)
	if err != nil {
		return httpresponse.NewErrorResponse(ctx, err)
	}

	return httpresponse.NewSuccessResponse(ctx, httpresponse.SummaryToResponse(summary), http.StatusOK)
}

// GetDiscrepancy godoc
// @Summary      Get a single discrepancy detail
// @Tags         tasks
// @Produce      json
// @Param        id      path  string  true  "Task UUID"
// @Param        disc_id path  int     true  "Discrepancy ID"
// @Success      200  {object}  httpresponse.Response{data=httpresponse.DiscrepancyResponse}
// @Failure      404  {object}  httpresponse.Response
// @Router       /v1/tasks/{id}/discrepancies/{disc_id} [get]
func (c *AuditController) GetDiscrepancy(ctx *echo.Context) error {
	taskID, err := parseUUIDParam(ctx, "id")
	if err != nil {
		return httpresponse.NewErrorResponse(ctx, entity.ErrBadRequest, "invalid task id")
	}
	discID, err := strconv.ParseInt(ctx.Param("disc_id"), 10, 64)
	if err != nil {
		return httpresponse.NewErrorResponse(ctx, entity.ErrBadRequest, "invalid discrepancy id")
	}

	d, err := c.useCase.GetDiscrepancy(ctx.Request().Context(), taskID, discID)
	if err != nil {
		return httpresponse.NewErrorResponse(ctx, err)
	}

	return httpresponse.NewSuccessResponse(ctx, httpresponse.DiscrepancyToResponse(d), http.StatusOK)
}

// UpdateResolutionStatus godoc
// @Summary      Update resolution status of a discrepancy
// @Tags         tasks
// @Accept       json
// @Produce      json
// @Param        id      path  string  true  "Task UUID"
// @Param        disc_id path  int     true  "Discrepancy ID"
// @Param        body    body  object{resolution_status=string}  true  "New status"
// @Success      200  {object}  httpresponse.Response
// @Failure      400  {object}  httpresponse.Response
// @Failure      404  {object}  httpresponse.Response
// @Router       /v1/tasks/{id}/discrepancies/{disc_id} [patch]
func (c *AuditController) UpdateResolutionStatus(ctx *echo.Context) error {
	taskID, err := parseUUIDParam(ctx, "id")
	if err != nil {
		return httpresponse.NewErrorResponse(ctx, entity.ErrBadRequest, "invalid task id")
	}
	discID, err := strconv.ParseInt(ctx.Param("disc_id"), 10, 64)
	if err != nil {
		return httpresponse.NewErrorResponse(ctx, entity.ErrBadRequest, "invalid discrepancy id")
	}

	var body struct {
		ResolutionStatus string `json:"resolution_status"`
	}
	if err := ctx.Bind(&body); err != nil {
		return httpresponse.NewErrorResponse(ctx, entity.ErrBadRequest, "invalid request body")
	}
	if body.ResolutionStatus == "" {
		return httpresponse.NewErrorResponse(ctx, entity.ErrBadRequest, "resolution_status is required")
	}

	err = c.useCase.UpdateResolutionStatus(ctx.Request().Context(), taskID, discID, entity.ResolutionStatus(body.ResolutionStatus))
	if err != nil {
		return httpresponse.NewErrorResponse(ctx, err)
	}

	return httpresponse.NewSuccessResponse(ctx, nil, http.StatusOK)
}

func parseUUIDParam(ctx *echo.Context, name string) (uuid.UUID, error) {
	return uuid.Parse(ctx.Param(name))
}

func readMultipartFile(fh *multipart.FileHeader) ([]byte, error) {
	f, err := fh.Open()
	if err != nil {
		return nil, err
	}
	defer f.Close()
	return io.ReadAll(f)
}
