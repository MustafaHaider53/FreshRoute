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
exports.InventoryController = void 0;
const common_1 = require("@nestjs/common");
const inventory_service_1 = require("./inventory.service");
const inventory_dto_1 = require("./inventory.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const client_1 = require("@prisma/client");
const swagger_1 = require("@nestjs/swagger");
let InventoryController = class InventoryController {
    inventoryService;
    constructor(inventoryService) {
        this.inventoryService = inventoryService;
    }
    create(req, dto) {
        return this.inventoryService.create(req.user.id, dto);
    }
    getFarmerInventory(req) {
        return this.inventoryService.getFarmerInventory(req.user.id);
    }
    getAllProducts() {
        return this.inventoryService.getAllProducts();
    }
    update(id, req, dto) {
        return this.inventoryService.update(id, req.user.id, dto);
    }
    remove(id, req) {
        return this.inventoryService.remove(id, req.user.id);
    }
    getPricingSuggestion(id, req) {
        return this.inventoryService.getPricingSuggestion(id, req.user.id);
    }
    acceptPrice(req, dto) {
        return this.inventoryService.acceptPricingSuggestion(req.user.id, dto);
    }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new produce listing (Farmer only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Listing successfully created' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - User is not a Farmer' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, inventory_dto_1.CreateProductDto]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER),
    (0, swagger_1.ApiOperation)({ summary: 'Get current inventory list for the logged-in Farmer' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Farmer inventory returned successfully' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getFarmerInventory", null);
__decorate([
    (0, common_1.Get)('all'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get all listings in the system (Buyer & Admin catalog)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'All listings returned successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getAllProducts", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER),
    (0, swagger_1.ApiOperation)({ summary: 'Update price and quantity for a listing (Farmer only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Listing updated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, inventory_dto_1.UpdateProductDto]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a listing (Farmer only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Listing deleted successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/suggest-price'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER),
    (0, swagger_1.ApiOperation)({ summary: 'Get AI price recommendation for a listing (Farmer only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'AI price recommendation returned' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getPricingSuggestion", null);
__decorate([
    (0, common_1.Post)('accept-price'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER),
    (0, swagger_1.ApiOperation)({ summary: 'Accept AI price recommendation (Farmer only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Price recommendation accepted and product updated' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, inventory_dto_1.AcceptPriceDto]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "acceptPrice", null);
exports.InventoryController = InventoryController = __decorate([
    (0, swagger_1.ApiTags)('inventory'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('inventory'),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], InventoryController);
//# sourceMappingURL=inventory.controller.js.map