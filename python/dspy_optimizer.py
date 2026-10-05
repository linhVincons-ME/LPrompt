"""Bounded JSON-in/JSON-out bridge for real DSPy few-shot compilation."""
import json
import sys


def main():
    try:
        import dspy
    except ImportError as exc:
        raise RuntimeError("Thiếu DSPy. Chạy: py -3 -m pip install -r python/requirements.txt") from exc

    request = json.load(sys.stdin)
    api_key = str(request.get("apiKey", "")).strip()
    model = str(request.get("model", "gemini-3.8-flash")).strip()
    instruction = str(request.get("prompt", "")).strip()
    rows = request.get("examples", [])
    if not api_key or not instruction or len(rows) < 2:
        raise ValueError("DSPy cần API key, prompt và tối thiểu 2 ví dụ có nhãn.")

    lm = dspy.LM(f"gemini/{model}", api_key=api_key, temperature=0.2, max_tokens=4096)
    dspy.configure(lm=lm)
    signature = dspy.Signature("input -> output", instructions=instruction)
    trainset = [dspy.Example(input=str(row["input"]), output=str(row["output"])).with_inputs("input") for row in rows]

    def metric(example, prediction, trace=None):
        expected = set(str(example.output).lower().split())
        actual = set(str(prediction.output).lower().split())
        return len(expected & actual) / max(1, len(expected | actual))

    student = dspy.Predict(signature)
    optimizer = dspy.BootstrapFewShot(metric=metric, max_bootstrapped_demos=4, max_labeled_demos=4, max_rounds=1)
    compiled = optimizer.compile(student=student, trainset=trainset)
    demos = getattr(compiled, "demos", []) or trainset
    result = [{"input": str(item.input), "output": str(item.output), "explanation": "Ví dụ được DSPy chọn trong compiled program."} for item in demos]
    print(json.dumps({"engine": "dspy", "optimizer": "BootstrapFewShot", "examples": result}, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"DSPy optimization failed: {exc}", file=sys.stderr)
        sys.exit(1)
