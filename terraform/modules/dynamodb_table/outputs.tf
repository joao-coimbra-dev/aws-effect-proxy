output "name" {
  description = "The name of the DynamoDB table."
  value       = aws_dynamodb_table.this.name
}

output "arn" {
  description = "The ARN of the DynamoDB table."
  value       = aws_dynamodb_table.this.arn
}
