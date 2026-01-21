output "api_endpoint" {
  description = "Base URL of the proxy"
  value       = module.api_gateway.api_endpoint
}

output "dynamodb_table_name" {
  description = "The name of the DynamoDB users table"
  value       = module.users_table.name
}

output "dynamodb_table_arn" {
  description = "The ARN of the DynamoDB users table"
  value       = module.users_table.arn
}