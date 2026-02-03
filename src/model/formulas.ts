type TokenType = 'number' | 'identifier' | 'operator' | 'paren' | 'comma';

type Token = {
  type: TokenType;
  value: string;
};

type AstNode =
  | { type: 'number'; value: number }
  | { type: 'variable'; name: string }
  | { type: 'binary'; operator: string; left: AstNode; right: AstNode }
  | { type: 'unary'; operator: string; argument: AstNode }
  | { type: 'call'; name: string; args: AstNode[] };

const operatorPrecedence: Record<string, number> = {
  '^': 4,
  '*': 3,
  '/': 3,
  '+': 2,
  '-': 2,
};

const rightAssociative = new Set(['^']);

const allowedFunctions = new Set(['min', 'max', 'log', 'exp', 'abs']);

export type FormulaValidation = {
  isValid: boolean;
  error?: string;
  variables: string[];
};

export const tokenize = (input: string): Token[] => {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const char = input[i];
    if (char === ' ' || char === '\n' || char === '\t') {
      i += 1;
      continue;
    }
    if (/[0-9.]/.test(char)) {
      let value = char;
      i += 1;
      while (i < input.length && /[0-9.]/.test(input[i])) {
        value += input[i];
        i += 1;
      }
      tokens.push({ type: 'number', value });
      continue;
    }
    if (/[a-zA-Z_]/.test(char)) {
      let value = char;
      i += 1;
      while (i < input.length && /[a-zA-Z0-9_]/.test(input[i])) {
        value += input[i];
        i += 1;
      }
      tokens.push({ type: 'identifier', value });
      continue;
    }
    if ('+-*/^'.includes(char)) {
      tokens.push({ type: 'operator', value: char });
      i += 1;
      continue;
    }
    if (char === '(' || char === ')') {
      tokens.push({ type: 'paren', value: char });
      i += 1;
      continue;
    }
    if (char === ',') {
      tokens.push({ type: 'comma', value: char });
      i += 1;
      continue;
    }
    throw new Error(`Unexpected character: ${char}`);
  }
  return tokens;
};

const parseExpression = (tokens: Token[]): { node: AstNode; rest: Token[] } => {
  const parsePrimary = (input: Token[]): { node: AstNode; rest: Token[] } => {
    const [token, ...rest] = input;
    if (!token) {
      throw new Error('Unexpected end of input');
    }
    if (token.type === 'number') {
      return { node: { type: 'number', value: Number(token.value) }, rest };
    }
    if (token.type === 'identifier') {
      if (rest[0]?.type === 'paren' && rest[0].value === '(') {
        const { args, remaining } = parseArguments(rest.slice(1));
        return {
          node: { type: 'call', name: token.value, args },
          rest: remaining,
        };
      }
      return { node: { type: 'variable', name: token.value }, rest };
    }
    if (token.type === 'operator' && token.value === '-') {
      const { node, rest: next } = parsePrimary(rest);
      return { node: { type: 'unary', operator: '-', argument: node }, rest: next };
    }
    if (token.type === 'paren' && token.value === '(') {
      const { node, rest: remaining } = parseExpression(rest);
      if (remaining[0]?.type !== 'paren' || remaining[0].value !== ')') {
        throw new Error('Missing closing parenthesis');
      }
      return { node, rest: remaining.slice(1) };
    }
    throw new Error(`Unexpected token: ${token.value}`);
  };

  const parseArguments = (input: Token[]): { args: AstNode[]; remaining: Token[] } => {
    const args: AstNode[] = [];
    let rest = input;
    if (rest[0]?.type === 'paren' && rest[0].value === ')') {
      return { args, remaining: rest.slice(1) };
    }
    while (rest.length > 0) {
      const parsed = parseExpression(rest);
      args.push(parsed.node);
      rest = parsed.rest;
      if (rest[0]?.type === 'comma') {
        rest = rest.slice(1);
        continue;
      }
      if (rest[0]?.type === 'paren' && rest[0].value === ')') {
        return { args, remaining: rest.slice(1) };
      }
      throw new Error('Malformed function arguments');
    }
    throw new Error('Missing closing parenthesis in arguments');
  };

  const parseBinary = (
    input: Token[],
    minPrecedence: number,
  ): { node: AstNode; rest: Token[] } => {
    let { node: left, rest } = parsePrimary(input);
    while (rest.length > 0) {
      const operatorToken = rest[0];
      if (operatorToken.type !== 'operator') {
        break;
      }
      const precedence = operatorPrecedence[operatorToken.value];
      if (precedence === undefined || precedence < minPrecedence) {
        break;
      }
      rest = rest.slice(1);
      const nextMin = precedence + (rightAssociative.has(operatorToken.value) ? 0 : 1);
      const parsedRight = parseBinary(rest, nextMin);
      left = {
        type: 'binary',
        operator: operatorToken.value,
        left,
        right: parsedRight.node,
      };
      rest = parsedRight.rest;
    }
    return { node: left, rest };
  };

  return parseBinary(tokens, 0);
};

export const parseFormula = (input: string): AstNode => {
  const tokens = tokenize(input);
  const { node, rest } = parseExpression(tokens);
  if (rest.length > 0) {
    throw new Error(`Unexpected token: ${rest[0].value}`);
  }
  return node;
};

export const collectVariables = (node: AstNode, vars = new Set<string>()): Set<string> => {
  if (node.type === 'variable') {
    vars.add(node.name);
  } else if (node.type === 'binary') {
    collectVariables(node.left, vars);
    collectVariables(node.right, vars);
  } else if (node.type === 'unary') {
    collectVariables(node.argument, vars);
  } else if (node.type === 'call') {
    node.args.forEach((arg) => collectVariables(arg, vars));
  }
  return vars;
};

export const validateFormula = (
  input: string,
  allowedVariables: string[],
): FormulaValidation => {
  try {
    const ast = parseFormula(input);
    const variables = Array.from(collectVariables(ast));
    for (const variable of variables) {
      if (!allowedVariables.includes(variable)) {
        return { isValid: false, error: `Unknown variable: ${variable}`, variables };
      }
    }
    const unknownCalls: string[] = [];
    const visit = (node: AstNode) => {
      if (node.type === 'call') {
        if (!allowedFunctions.has(node.name)) {
          unknownCalls.push(node.name);
        }
        node.args.forEach(visit);
      } else if (node.type === 'binary') {
        visit(node.left);
        visit(node.right);
      } else if (node.type === 'unary') {
        visit(node.argument);
      }
    };
    visit(ast);
    if (unknownCalls.length > 0) {
      return { isValid: false, error: `Unknown function: ${unknownCalls[0]}`, variables };
    }
    return { isValid: true, variables };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Invalid formula',
      variables: [],
    };
  }
};

const applyOperator = (operator: string, left: number, right: number): number => {
  switch (operator) {
    case '+':
      return left + right;
    case '-':
      return left - right;
    case '*':
      return left * right;
    case '/':
      return left / right;
    case '^':
      return left ** right;
    default:
      throw new Error(`Unsupported operator: ${operator}`);
  }
};

const callFunction = (name: string, args: number[]): number => {
  switch (name) {
    case 'min':
      return Math.min(...args);
    case 'max':
      return Math.max(...args);
    case 'log':
      return Math.log(args[0]);
    case 'exp':
      return Math.exp(args[0]);
    case 'abs':
      return Math.abs(args[0]);
    default:
      throw new Error(`Unsupported function: ${name}`);
  }
};

export const evaluateFormula = (node: AstNode, context: Record<string, number>): number => {
  switch (node.type) {
    case 'number':
      return node.value;
    case 'variable': {
      const value = context[node.name];
      if (value === undefined) {
        throw new Error(`Missing variable: ${node.name}`);
      }
      return value;
    }
    case 'binary':
      return applyOperator(
        node.operator,
        evaluateFormula(node.left, context),
        evaluateFormula(node.right, context),
      );
    case 'unary':
      if (node.operator === '-') {
        return -evaluateFormula(node.argument, context);
      }
      throw new Error(`Unsupported unary operator: ${node.operator}`);
    case 'call':
      return callFunction(
        node.name,
        node.args.map((arg) => evaluateFormula(arg, context)),
      );
    default:
      throw new Error('Invalid AST node');
  }
};

export const safeEvaluateFormula = (
  input: string,
  context: Record<string, number>,
): { value?: number; error?: string } => {
  try {
    const ast = parseFormula(input);
    return { value: evaluateFormula(ast, context) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Evaluation failed' };
  }
};

export const getAllowedFunctions = () => Array.from(allowedFunctions);
