using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddSalesModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "currency",
                table: "tenant_configs",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "call_logs",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    tenant_id = table.Column<string>(type: "text", nullable: false),
                    customer_phone = table.Column<string>(type: "text", nullable: true),
                    duration_seconds = table.Column<int>(type: "integer", nullable: false),
                    transcript = table.Column<string>(type: "text", nullable: true),
                    summary = table.Column<string>(type: "text", nullable: true),
                    recording_url = table.Column<string>(type: "text", nullable: true),
                    cost = table.Column<decimal>(type: "numeric", nullable: false),
                    started_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ended_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    call_type = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_call_logs", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "lead_tasks",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    lead_id = table.Column<string>(type: "text", nullable: false),
                    tenant_id = table.Column<string>(type: "text", nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
                    due_date = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    is_completed = table.Column<bool>(type: "boolean", nullable: false),
                    assigned_to = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_lead_tasks", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "leads",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    tenant_id = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    phone = table.Column<string>(type: "text", nullable: false),
                    email = table.Column<string>(type: "text", nullable: true),
                    stage = table.Column<string>(type: "text", nullable: false),
                    score = table.Column<int>(type: "integer", nullable: false),
                    assigned_to = table.Column<string>(type: "text", nullable: true),
                    summary = table.Column<string>(type: "text", nullable: true),
                    source = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_leads", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "quote_items",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    quote_id = table.Column<string>(type: "text", nullable: false),
                    item_name = table.Column<string>(type: "text", nullable: false),
                    quantity = table.Column<int>(type: "integer", nullable: false),
                    unit_price = table.Column<decimal>(type: "numeric", nullable: false),
                    total_price = table.Column<decimal>(type: "numeric", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_quote_items", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "quotes",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    tenant_id = table.Column<string>(type: "text", nullable: false),
                    lead_id = table.Column<string>(type: "text", nullable: true),
                    customer_name = table.Column<string>(type: "text", nullable: false),
                    customer_phone = table.Column<string>(type: "text", nullable: false),
                    customer_email = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<string>(type: "text", nullable: false),
                    subtotal = table.Column<decimal>(type: "numeric", nullable: false),
                    tax_rate = table.Column<decimal>(type: "numeric", nullable: false),
                    tax_amount = table.Column<decimal>(type: "numeric", nullable: false),
                    discount_amount = table.Column<decimal>(type: "numeric", nullable: false),
                    total_amount = table.Column<decimal>(type: "numeric", nullable: false),
                    digital_signature = table.Column<string>(type: "text", nullable: true),
                    signed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_quotes", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "service_items",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    tenant_id = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    price = table.Column<decimal>(type: "numeric", nullable: true),
                    duration_minutes = table.Column<int>(type: "integer", nullable: true),
                    category = table.Column<string>(type: "text", nullable: false),
                    is_disabled = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_service_items", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "unified_order_items",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    order_id = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    quantity = table.Column<int>(type: "integer", nullable: false),
                    unit_price = table.Column<decimal>(type: "numeric", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_unified_order_items", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "unified_orders",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    tenant_id = table.Column<string>(type: "text", nullable: false),
                    customer_name = table.Column<string>(type: "text", nullable: false),
                    customer_phone = table.Column<string>(type: "text", nullable: false),
                    source = table.Column<string>(type: "text", nullable: false),
                    order_type = table.Column<string>(type: "text", nullable: false),
                    scheduled_date = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    status = table.Column<string>(type: "text", nullable: false),
                    total_amount = table.Column<decimal>(type: "numeric", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_unified_orders", x => x.id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "call_logs");

            migrationBuilder.DropTable(
                name: "lead_tasks");

            migrationBuilder.DropTable(
                name: "leads");

            migrationBuilder.DropTable(
                name: "quote_items");

            migrationBuilder.DropTable(
                name: "quotes");

            migrationBuilder.DropTable(
                name: "service_items");

            migrationBuilder.DropTable(
                name: "unified_order_items");

            migrationBuilder.DropTable(
                name: "unified_orders");

            migrationBuilder.DropColumn(
                name: "currency",
                table: "tenant_configs");
        }
    }
}
