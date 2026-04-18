package controller

import (
	"net/http"

	"github.com/labstack/echo/v5"
	echomiddleware "github.com/labstack/echo/v5/middleware"
	_ "github.com/ryl1k/best-lviv-2026/docs"
	v1 "github.com/ryl1k/best-lviv-2026/internal/controller/http/v1"
	"github.com/ryl1k/best-lviv-2026/internal/controller/http/v1/middleware"
	"github.com/ryl1k/best-lviv-2026/internal/dto/httprequest"
	echoSwagger "github.com/swaggo/echo-swagger/v2"
)

// Swagger spec:
// @title Best Lviv api docs
// @version 1.0
// @description swagger documentation.
// @version     1.0

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and JWT token, "Bearer <token>".

type Router struct {
	e *echo.Echo

	middleware             *middleware.Middleware
	authController         *v1.AuthController
	auditController        *v1.AuditController
	subscriptionController *v1.SubscriptionController
	validator              *httprequest.CustomValidator
}

func NewRouter(
	e *echo.Echo,
	middleware *middleware.Middleware,
	authController *v1.AuthController,
	auditController *v1.AuditController,
	subscriptionController *v1.SubscriptionController,
	validator *httprequest.CustomValidator,
) *Router {
	return &Router{
		e:                      e,
		middleware:             middleware,
		authController:         authController,
		auditController:        auditController,
		subscriptionController: subscriptionController,
		validator:              validator,
	}
}

func (r *Router) RegisterRoutes() {
	r.e.Use(r.middleware.RequestLogger())

	r.e.GET("/health", func(c *echo.Context) error { return c.JSON(http.StatusOK, map[string]string{"status": "healthy"}) })
	r.e.GET("/swagger/*", echoSwagger.WrapHandlerV3)
	r.e.Use(echomiddleware.CORSWithConfig(echomiddleware.CORSConfig{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodPatch, http.MethodDelete, http.MethodOptions},
		AllowHeaders: []string{"Origin", "Content-Type", "Accept", "Authorization"},
	}))
	r.e.Validator = r.validator
	v1 := r.e.Group("/v1")

	withJWT := r.middleware.WithJWT()
	// withPagination := r.middleware.WithPagination()

	// Auth
	{
		auth := v1.Group("/auth")
		auth.POST("/signup", r.authController.SignUp)
		auth.POST("/login", r.authController.Login)
		auth.GET("/me", r.authController.GetMe, withJWT)
	}

	// Subscriptions
	{
		subs := v1.Group("/subscriptions")
		subs.GET("", r.subscriptionController.List)
		subs.GET("/me", r.subscriptionController.GetMine, withJWT)
		subs.POST("/:id/purchase", r.subscriptionController.Purchase, withJWT)
	}

	// Audits
	{
		v1.POST("/audits/upload", r.auditController.Upload, withJWT)
		v1.POST("/audits/upload/json", r.auditController.UploadJSON, withJWT)
	}

	// Tasks
	{
		tasks := v1.Group("/tasks")
		tasks.GET("/:id", r.auditController.GetTask)
		tasks.GET("/:id/results", r.auditController.GetResults)
		tasks.GET("/:id/results/summary", r.auditController.GetSummary)
		tasks.GET("/:id/discrepancies/:disc_id", r.auditController.GetDiscrepancy)
		tasks.PATCH("/:id/discrepancies/:disc_id", r.auditController.UpdateResolutionStatus)
		tasks.GET("/:id/export", r.auditController.ExportDiscrepancies)
		tasks.GET("/:id/persons", r.auditController.GetPersons)
	}
}
