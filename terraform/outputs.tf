output "api_endpoint" {
  description = "Base URL of the proxy"
  value       = aws_apigatewayv2_api.http_api.api_endpoint
}

output "dynamodb_table_name" {
  description = "The name of the DynamoDB users table"
  value       = aws_dynamodb_table.users_table.name
}

output "dynamodb_table_arn" {
  description = "The ARN of the DynamoDB users table"
  value       = aws_dynamodb_table.users_table.arn
}