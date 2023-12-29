import * as t from '@babel/types';

export const parseGeneratorReturnType = (generator: t.FunctionDeclaration): { yieldType: t.TSType, returnType: t.TSType, nextStepParamType: t.TSType } => {
    if (!generator.returnType || !t.isTSTypeAnnotation(generator.returnType) || !((generator.returnType as t.TSTypeAnnotation).typeAnnotation as t.TSTypeReference).typeParameters?.params) {
        return { yieldType: t.tsAnyKeyword(), returnType: t.tsAnyKeyword(), nextStepParamType: t.tsAnyKeyword() };
    }
    const [yieldType, returnType, nextStepParamType] = ((generator.returnType as t.TSTypeAnnotation).typeAnnotation as t.TSTypeReference).typeParameters?.params!;
    return { yieldType, returnType, nextStepParamType }
}