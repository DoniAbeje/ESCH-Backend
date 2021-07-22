import { IsString, MinLength } from "class-validator";

export class RaiseQuestionDto {
    @IsString()
    readonly question: string

    @MinLength(1)
    readonly tags: string[]
}