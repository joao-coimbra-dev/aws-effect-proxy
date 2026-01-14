# AWS Effect Proxy

This repository contains a simple AWS Lambda function, written in TypeScript using the [Effect](https://www.effect.website/) library, that acts as a proxy. It is deployed and managed using Terraform.

## What is implemented

The project consists of:

- **An Effect-based Lambda function**: This function, written in TypeScript and leveraging the Effect library for robust, type-safe, and functional error handling, receives a request from an Amazon API Gateway, forwards it to a target URL, and returns the response to the original caller. The target URL is configured via a `TARGET_URL` environment variable.
- **Terraform configuration**: The configuration in the `terraform/` directory defines the necessary AWS resources to deploy the proxy, including:
  - An AWS Lambda function.
  - An IAM role for the Lambda function.
  - An HTTP API Gateway with an integration, route, and stage.
  - Permissions for the API Gateway to invoke the Lambda function.

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
