package v1

import (
	"context"
	"encoding/csv"
	"fmt"
	"io"
	"log/slog"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strconv"

	"github.com/google/uuid"
	"github.com/labstack/echo/v5"
	"github.com/ryl1k/best-lviv-2026/internal/dto"
	"github.com/ryl1k/best-lviv-2026/internal/dto/httprequest"
	"github.com/ryl1k/best-lviv-2026/internal/dto/httpresponse"
	"github.com/ryl1k/best-lviv-2026/internal/entity"
	"github.com/ryl1k/best-lviv-2026/internal/repo"
	"github.com/ryl1k/best-lviv-2026/internal/usecase"
)

type auditSubscriptionUseCase interface {
	GetUserSubscription(ctx context.Context, userID int) (entity.UserSubscription, error)
	IncrementCSVTries(ctx context.Context, userSubID int64) error
}

type AuditController struct {
	logger     *slog.Logger
	useCase    usecase.AuditUseCase
	subUseCase auditSubscriptionUseCase
}

func NewAuditController(logger *slog.Logger, useCase usecase.AuditUseCase, subUseCase auditSubscriptionUseCase) *AuditController {
	return &AuditController{logger: logger, useCase: useCase, subUseCase: subUseCase}
}

// Upload godoc
// @Summary      Upload registry files for audit
// @Tags         audits
// @Accept       multipart/form-data
// @Produce      json
// @Param        land_file   formData  file  true  "Land registry file (.xlsx or .csv)"
// @Param        estate_file formData  file  true  "Estate registry file (.xlsx or .csv)"
// @Security     BearerAuth
// @Success      202  {object}  httpresponse.Response{data=httpresponse.UploadTaskResponse}
// @Failure      400  {object}  httpresponse.Response
// @Failure      500  {object}  httpresponse.Response
// @Router       /v1/audits/upload [post]
func (c *AuditController) Upload(ctx *echo.Context) error {
	userClaims := ctx.Get(entity.UserKey).(dto.UserClaims)

	userSub, err := c.subUseCase.GetUserSubscription(ctx.Request().Context(), userClaims.UserID)
	if err != nil {
		return httpresponse.NewErrorResponse(ctx, entity.ErrNoActiveSubscription, "active subscription required")
	}
	if !userSub.HasTriesRemaining(entity.ResourceCSV) {
		return httpresponse.NewErrorResponse(ctx, entity.ErrNoTriesRemaining, "no CSV tries remaining")
	}

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

	taskID, err := c.useCase.Upload(ctx.Request().Context(), int64(userClaims.UserID), landData, estateData, landExt, estateExt)
	if err != nil {
		c.logger.Error("upload failed", "error", err)
		return httpresponse.NewErrorResponse(ctx, err)
	}

	if err := c.subUseCase.IncrementCSVTries(ctx.Request().Context(), userSub.ID); err != nil {
		c.logger.Error("failed to increment csv tries", "error", err, "user_sub_id", userSub.ID)
	}

	return ctx.JSON(http.StatusAccepted, &httpresponse.Response{
		Data: httpresponse.UploadTaskResponse{TaskID: taskID},
		Metadata: httpresponse.ResponseMetadata{
			StatusCode: http.StatusAccepted,
		},
	})
}

// UploadJSON godoc
// @Summary      Upload audit data as JSON
// @Tags         audits
// @Accept       json
// @Produce      json
// @Param        request  body      httprequest.UploadJSON  true  "Land and estate records"
// @Security     BearerAuth
// @Success      202  {object}  httpresponse.Response{data=httpresponse.UploadTaskResponse}
// @Failure      400  {object}  httpresponse.Response
// @Failure      500  {object}  httpresponse.Response
// @Router       /v1/audits/upload/json [post]
func (c *AuditController) UploadJSON(ctx *echo.Context) error {
	userClaims := ctx.Get(entity.UserKey).(dto.UserClaims)

	userSub, err := c.subUseCase.GetUserSubscription(ctx.Request().Context(), userClaims.UserID)
	if err != nil {
		return httpresponse.NewErrorResponse(ctx, entity.ErrNoActiveSubscription, "active subscription required")
	}
	if !userSub.HasTriesRemaining(entity.ResourceCSV) {
		return httpresponse.NewErrorResponse(ctx, entity.ErrNoTriesRemaining, "no CSV tries remaining")
	}

	var req httprequest.UploadJSON
	if err := ctx.Bind(&req); err != nil {
		return httpresponse.NewErrorResponse(ctx, entity.ErrBadRequest, "invalid request body")
	}
	if err := ctx.Validate(req); err != nil {
		return httpresponse.NewErrorResponse(ctx, entity.ErrBadRequest, err.Error())
	}

	landRecords := make([]entity.LandRecord, len(req.LandRecords))
	for i, r := range req.LandRecords {
		landRecords[i] = entity.LandRecord{
			CadastralNum:   r.CadastralNum,
			Koatuu:         r.Koatuu,
			OwnershipForm:  r.OwnershipForm,
			PurposeCode:    r.PurposeCode,
			PurposeText:    r.PurposeText,
			Location:       r.Location,
			LandUseType:    r.LandUseType,
			AreaHa:         r.AreaHa,
			NormativeValue: r.NormativeValue,
			TaxID:          r.TaxID,
			OwnerName:      r.OwnerName,
			Share:          r.Share,
			RegisteredAt:   r.RegisteredAt,
			Raw:            r.Raw,
		}
	}

	estateRecords := make([]entity.EstateRecord, len(req.EstateRecords))
	for i, r := range req.EstateRecords {
		estateRecords[i] = entity.EstateRecord{
			TaxID:        r.TaxID,
			OwnerName:    r.OwnerName,
			ObjectType:   r.ObjectType,
			Address:      r.Address,
			RegisteredAt: r.RegisteredAt,
			TerminatedAt: r.TerminatedAt,
			AreaM2:       r.AreaM2,
			CoOwnership:  r.CoOwnership,
			Share:        r.Share,
			Raw:          r.Raw,
		}
	}

	taskID, err := c.useCase.UploadFromRecords(ctx.Request().Context(), int64(userClaims.UserID), landRecords, estateRecords)
	if err != nil {
		c.logger.Error("upload json failed", "error", err)
		return httpresponse.NewErrorResponse(ctx, err)
	}

	if err := c.subUseCase.IncrementCSVTries(ctx.Request().Context(), userSub.ID); err != nil {
		c.logger.Error("failed to increment csv tries", "error", err, "user_sub_id", userSub.ID)
	}

	return ctx.JSON(http.StatusAccepted, &httpresponse.Response{
		Data: httpresponse.UploadTaskResponse{TaskID: taskID},
		Metadata: httpresponse.ResponseMetadata{
			StatusCode: http.StatusAccepted,
		},
	})
}

// ListTasks godoc
// @Summary      List all tasks for the authenticated user
// @Tags         tasks
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  httpresponse.Response{data=[]httpresponse.TaskResponse}
// @Failure      401  {object}  httpresponse.Response
// @Router       /v1/tasks [get]
func (c *AuditController) ListTasks(ctx *echo.Context) error {
	userClaims := ctx.Get(entity.UserKey).(dto.UserClaims)

	tasks, err := c.useCase.ListTasks(ctx.Request().Context(), int64(userClaims.UserID))
	if err != nil {
		return httpresponse.NewErrorResponse(ctx, err)
	}

	responses := make([]httpresponse.TaskResponse, 0, len(tasks))
	for _, t := range tasks {
		responses = append(responses, httpresponse.TaskToResponse(t))
	}

	return httpresponse.NewSuccessResponse(ctx, responses, http.StatusOK)
}

// GetTask godoc
// @Summary      Get task status and stats
// @Tags         tasks
// @Produce      json
// @Param        id  path  string  true  "Task UUID"
// @Security     BearerAuth
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
// @Security     BearerAuth
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
// @Security     BearerAuth
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

// ExplainDiscrepancy godoc
// @Summary      Get AI explanation for a discrepancy
// @Tags         tasks
// @Produce      json
// @Param        id      path  string  true  "Task UUID"
// @Param        disc_id path  int     true  "Discrepancy ID"
// @Success      200  {object}  httpresponse.Response{data=object{explanation=string}}
// @Failure      404  {object}  httpresponse.Response
// @Failure      503  {object}  httpresponse.Response
// @Router       /v1/tasks/{id}/discrepancies/{disc_id}/explain [get]
func (c *AuditController) ExplainDiscrepancy(ctx *echo.Context) error {
	taskID, err := parseUUIDParam(ctx, "id")
	if err != nil {
		return httpresponse.NewErrorResponse(ctx, entity.ErrBadRequest, "invalid task id")
	}
	discID, err := strconv.ParseInt(ctx.Param("disc_id"), 10, 64)
	if err != nil {
		return httpresponse.NewErrorResponse(ctx, entity.ErrBadRequest, "invalid discrepancy id")
	}

	explanation, err := c.useCase.ExplainDiscrepancy(ctx.Request().Context(), taskID, discID)
	if err != nil {
		return httpresponse.NewErrorResponse(ctx, err)
	}

	return httpresponse.NewSuccessResponse(ctx, map[string]string{"explanation": explanation}, http.StatusOK)
}

// GetPersons godoc
// @Summary      Get persons ranked by cumulative risk score
// @Tags         tasks
// @Produce      json
// @Param        id        path   string  true   "Task UUID"
// @Param        page      query  int     false  "Page number (default 1)"
// @Param        page_size query  int     false  "Page size (default 50)"
// @Success      200  {object}  httpresponse.Response{data=httpresponse.PaginatedPersonsResponse}
// @Failure      404  {object}  httpresponse.Response
// @Router       /v1/tasks/{id}/persons [get]
func (c *AuditController) GetPersons(ctx *echo.Context) error {
	taskID, err := parseUUIDParam(ctx, "id")
	if err != nil {
		return httpresponse.NewErrorResponse(ctx, entity.ErrBadRequest, "invalid task id")
	}

	page, _ := strconv.Atoi(ctx.QueryParam("page"))
	pageSize, _ := strconv.Atoi(ctx.QueryParam("page_size"))

	persons, total, err := c.useCase.GetPersons(ctx.Request().Context(), taskID, page, pageSize)
	if err != nil {
		return httpresponse.NewErrorResponse(ctx, err)
	}

	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 50
	}

	items := make([]httpresponse.PersonRiskResponse, 0, len(persons))
	for _, p := range persons {
		items = append(items, httpresponse.PersonRiskResponse{
			TaxID:            p.TaxID,
			OwnerName:        p.OwnerName,
			TotalRiskScore:   p.TotalRiskScore,
			MaxSeverity:      p.MaxSeverity,
			DiscrepancyCount: p.DiscrepancyCount,
			RuleCodes:        p.RuleCodes,
		})
	}

	return httpresponse.NewSuccessResponse(ctx, httpresponse.PaginatedPersonsResponse{
		Items:    items,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	}, http.StatusOK)
}

// ExportDiscrepancies godoc
// @Summary      Export all discrepancies for a task as CSV
// @Tags         tasks
// @Produce      text/csv
// @Param        id  path  string  true  "Task UUID"
// @Success      200  {string}  string  "CSV file"
// @Failure      404  {object}  httpresponse.Response
// @Router       /v1/tasks/{id}/export [get]
func (c *AuditController) ExportDiscrepancies(ctx *echo.Context) error {
	taskID, err := parseUUIDParam(ctx, "id")
	if err != nil {
		return httpresponse.NewErrorResponse(ctx, entity.ErrBadRequest, "invalid task id")
	}

	items, err := c.useCase.Export(ctx.Request().Context(), taskID)
	if err != nil {
		return httpresponse.NewErrorResponse(ctx, err)
	}

	ctx.Response().Header().Set("Content-Type", "text/csv; charset=utf-8")
	ctx.Response().Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="revela-export-%s.csv"`, taskID))
	ctx.Response().WriteHeader(http.StatusOK)

	w := csv.NewWriter(ctx.Response())
	_ = w.Write([]string{"id", "rule_code", "severity", "risk_score", "tax_id", "owner_name", "description", "resolution_status"})
	for _, d := range items {
		_ = w.Write([]string{
			strconv.FormatInt(d.ID, 10),
			string(d.RuleCode),
			string(d.Severity),
			strconv.Itoa(d.RiskScore),
			d.TaxID,
			d.OwnerName,
			d.Description,
			string(d.ResolutionStatus),
		})
	}
	w.Flush()
	return w.Error()
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
