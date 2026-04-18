package v1

import (
	"context"
	"log/slog"
	"net/http"

	"github.com/labstack/echo/v5"
	"github.com/ryl1k/best-lviv-2026/internal/dto"
	"github.com/ryl1k/best-lviv-2026/internal/dto/httprequest"
	"github.com/ryl1k/best-lviv-2026/internal/dto/httpresponse"
	"github.com/ryl1k/best-lviv-2026/internal/entity"
)

type authUseCase interface {
	Login(ctx context.Context, email, password string) (string, error)
	Create(ctx context.Context, username, email, password string) error
	GetById(ctx context.Context, id int) (entity.User, error)
}
type AuthController struct {
	logger      *slog.Logger
	authUseCase authUseCase
}

func NewAuthController(logger *slog.Logger, authUseCase authUseCase) *AuthController {
	l := logger.WithGroup("auth_controller")
	return &AuthController{
		logger:      l,
		authUseCase: authUseCase,
	}
}

// Login godoc
// @Summary      User login
// @Description  Authenticates a user using email and password, returning a JWT token for further requests.
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Param        request  body      httprequest.Login  true  "Login credentials"
// @Success      200      {object}  httpresponse.Response{Data=string} "Successfully authenticated, returns JWT token"
// @Failure      400      {object}  httpresponse.Response{} "Bad Request - Invalid credentials or validation error"
// @Failure      500      {object}  httpresponse.Response{} "Internal Server Error"
// @Router       /v1/auth/login [post]
func (c *AuthController) Login(ctx *echo.Context) error {
	var req httprequest.Login

	l := c.logger.With("method", "login")
	err := ctx.Bind(&req)
	if err != nil {
		l.Warn("failed to parse request", "error", err)
		return httpresponse.NewErrorResponse(ctx, entity.ErrBadRequest, err.Error())
	}

	err = ctx.Validate(req)
	if err != nil {
		l.Warn("failed to validate request", "error", err)
		return httpresponse.NewErrorResponse(ctx, entity.ErrBadRequest, err.Error())
	}

	token, err := c.authUseCase.Login(ctx.Request().Context(), req.Email, req.Password)
	if err != nil {
		l.Error("failed to login", "error", err)
		return httpresponse.NewErrorResponse(ctx, err, "failed to login")
	}

	return httpresponse.NewSuccessResponse(ctx, token, http.StatusOK)
}

// SignUp godoc
// @Summary      Register a new user
// @Description  Creates a new user account with the provided username, email, and password.
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Param        request  body      httprequest.CreateUser  true  "Registration credentials"
// @Success      201      {object}  httpresponse.Response{} "User created successfully"
// @Failure      400      {object}  httpresponse.Response{} "Bad Request - Validation error"
// @Failure      409      {object}  httpresponse.Response{} "Conflict - Username already exists"
// @Failure      500      {object}  httpresponse.Response{} "Internal Server Error"
// @Router       /v1/auth/signup [post]
func (c *AuthController) SignUp(ctx *echo.Context) error {
	var req httprequest.CreateUser

	l := c.logger.With("method", "signup")
	if err := ctx.Bind(&req); err != nil {
		l.Warn("failed to parse request", "error", err)
		return httpresponse.NewErrorResponse(ctx, entity.ErrBadRequest, err.Error())
	}

	if err := ctx.Validate(req); err != nil {
		l.Warn("failed to validate request", "error", err)
		return httpresponse.NewErrorResponse(ctx, entity.ErrBadRequest, err.Error())
	}

	if err := c.authUseCase.Create(ctx.Request().Context(), req.Username, req.Email, req.Password); err != nil {
		l.Error("failed to create user", "error", err)
		return httpresponse.NewErrorResponse(ctx, err, "failed to create user")
	}

	return httpresponse.NewSuccessResponse(ctx, nil, http.StatusCreated)
}

// GetMe godoc
// @Summary      Get current user profile
// @Description  Retrieves the details of the currently authenticated user using the provided JWT token.
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200      {object}  httpresponse.Response{Data=entity.User} "Successfully retrieved user profile"
// @Failure      401      {object}  httpresponse.Response{} "Unauthorized - Invalid or missing token"
// @Failure      500      {object}  httpresponse.Response{} "Internal Server Error"
// @Router       /v1/auth/me [get]
func (c *AuthController) GetMe(ctx *echo.Context) error {
	userClaims := ctx.Get(entity.UserKey).(dto.UserClaims)

	l := c.logger.With("method", "get_me", "user", userClaims)

	user, err := c.authUseCase.GetById(ctx.Request().Context(), userClaims.UserID)
	if err != nil {
		l.Error("failed to get user by id", "error", err)
		return httpresponse.NewErrorResponse(ctx, err, "failed to get user by id")
	}

	return httpresponse.NewSuccessResponse(ctx, user, http.StatusOK)
}
