from pybars import Compiler


def fill_in_template(template_string, data):
    compiler = Compiler()
    template = compiler.compile(template_string)

    result = template(data)
    return result
