"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiController = void 0;
const common_1 = require("@nestjs/common");
const demand_forecast_service_1 = require("./demand-forecast.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
let AiController = class AiController {
    demandForecastService;
    constructor(demandForecastService) {
        this.demandForecastService = demandForecastService;
    }
    getForecast(category, week, year) {
        const currentDate = new Date();
        const startDate = new Date(currentDate.getFullYear(), 0, 1);
        const days = Math.floor((currentDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
        const currentWeekDefault = Math.ceil(days / 7);
        const currentWeek = parseInt(week) || currentWeekDefault;
        const currentYear = parseInt(year) || currentDate.getFullYear();
        return this.demandForecastService.getForecast(category || 'all', currentWeek, currentYear);
    }
};
exports.AiController = AiController;
__decorate([
    (0, common_1.Get)('forecast'),
    (0, roles_decorator_1.Roles)('FARMER', 'ADMIN'),
    __param(0, (0, common_1.Query)('category')),
    __param(1, (0, common_1.Query)('week')),
    __param(2, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "getForecast", null);
exports.AiController = AiController = __decorate([
    (0, common_1.Controller)('ai'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [demand_forecast_service_1.DemandForecastService])
], AiController);
//# sourceMappingURL=ai.controller.js.map