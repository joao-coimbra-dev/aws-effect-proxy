# AWS Effect Proxy

This repository contains a simple AWS Lambda function, written in TypeScript using the [Effect](https://www.effect.website/) library, that acts as a proxy. It is deployed and managed using Terraform.

## What is implemented

The project consists of:

- **An Effect-based Lambda function**: This function, written in TypeScript and leveraging the Effect library for robust, type-safe, and functional error handling, receives a request from an Amazon API Gateway, forwards it to a target URL, and returns the response to the original caller. The target URL is configured via a `TARGET_URL` environment variable.
- **Terraform configuration**: The configuration in the `terraform/` directory defines all the necessary AWS resources. It is organized into reusable modules to promote clarity, isolation, and reusability. The main `main.tf` file orchestrates these modules to build the application's infrastructure.
  - **Modules**:
    - `modules/lambda_function`: A generic module for creating an AWS Lambda function with its IAM role. It is instantiated for both the proxy and the user services.
    - `modules/dynamodb_table`: A module for creating the DynamoDB table for users.
    - `modules/api_gateway`: A module for creating the HTTP API Gateway, including all routes and integrations.
  - **Root Files**: The `main.tf`, `variables.tf`, and `outputs.tf` in the `terraform/` directory define the high-level architecture and connect the modules together.

## How to use it

### Prerequisites

- [Node.js](https://nodejs.org/) (as specified in `.nvmrc`)
- [pnpm](https://pnpm.io/)
- [Terraform](https://www.terraform.io/)
- [AWS CLI](https://aws.amazon.com/cli/) configured with your credentials.
- [TFLint](https://github.com/terraform-linters/tflint) (for linting Terraform code)

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    ```
2.  Navigate into the project directory and install the dependencies:
    ```bash
    cd aws-effect-proxy
    pnpm install
    ```

### Build

To build the Lambda function for deployment, run the following command. This uses `esbuild` to compile the TypeScript code into a single JavaScript module.

```bash
pnpm build
```

### Type Checking

To ensure the code is type-safe, you can run the TypeScript compiler without emitting any files:

```bash
pnpm typecheck
```

### Deployment

To deploy the proxy to your AWS account using Terraform, follow these steps:

1.  Navigate to the `terraform` directory:
    ```bash
    cd terraform
    ```
2.  Initialize Terraform to download the necessary providers:
    ```bash
    terraform init
    ```
3.  **Optional but Recommended**: Lint the Terraform code to check for errors and best practices. (You may need to run `tflint --init` the first time.)
    ```bash
    tflint
    ```
4.  Review the execution plan to see what resources will be created:
    ```bash
    terraform plan
    ```
5.  Apply the Terraform configuration to deploy the resources:
    ```bash
    terraform apply
    ```

This will create the AWS resources and deploy the Lambda function. After the apply completes, Terraform will display the API Gateway URL as an output, which you can use to invoke your proxy.
