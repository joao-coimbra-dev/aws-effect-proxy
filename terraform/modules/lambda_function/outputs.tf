output "invoke_arn" {
  description = "The ARN to be used for invoking the Lambda function."
  value       = aws_lambda_function.this.invoke_arn
}

output "function_name" {
  description = "The name of the Lambda function."
  value       = aws_lambda_function.this.function_name
}

output "role_arn" {
  description = "The ARN of the IAM role created for the Lambda function."
  value       = aws_iam_role.lambda_exec.arn
}

output "arn" {
  description = "The ARN of the Lambda function."
  value       = aws_lambda_function.this.arn
}
