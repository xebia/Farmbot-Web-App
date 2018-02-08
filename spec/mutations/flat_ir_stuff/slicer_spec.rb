require "spec_helper"
require_relative "./flat_ir_helpers"

describe CeleryScript::Slicer do
  kind   = CeleryScript::CSHeap::KIND
  parent = CeleryScript::CSHeap::PARENT
  next_  = CeleryScript::CSHeap::NEXT
  body   = CeleryScript::CSHeap::BODY

  n = "nothing"

  CORRECT_LINKAGE = { # Came from the JS implementation which is known good.
    "sequence"          => { p: n,              b: "take_photo", n: n },
    "scope_declaration" => { p: "sequence",     b: n,            n: n, },
    "take_photo"        => { p: "sequence",     b: n,            n: "send_message", },
    "send_message"      => { p: "take_photo",   b: "channel",    n: "_if",},
    "channel"           => { p: "send_message", b: n,            n: n, },
    "_if"               => { p: "send_message", b: n,            n: n, },
    "execute"           => { p: "_if",          b: n,            n: n, },
  }

  it "has edge cases" do
    heap = CeleryScript::FlatIrHelpers.flattened_heap
    nothing_node = heap[0]
    expect(nothing_node[kind]).to         eq(n)
    expect(nothing_node[body].value).to   eq(0)
    expect(nothing_node[parent].value).to eq(0)
    expect(nothing_node[next_].value).to  eq(0)
    output = heap.index_by { |x| x[kind] }
    CORRECT_LINKAGE.keys.map do |target_kind|
        actual      = output[target_kind]
        expectation = CORRECT_LINKAGE[actual[kind]]
        expect(actual[kind]).to eq(target_kind)

        parent_addr = output[target_kind][parent].value
        parent_kind = heap[parent_addr][kind]
        expect(parent_kind).to eq(expectation[:p])

        next_addr = output[target_kind][next_].value
        next_kind = heap[next_addr][kind]
        expect(next_kind).to eq(expectation[:n])

        body_addr = output[target_kind][body].value
        body_kind = heap[body_addr][kind]
        failure = "`#{target_kind}` needs a body of `#{expectation[:b]}`. "\
                  "Got `#{body_kind}`."
        expect(body_kind).to(eq(expectation[:b]), failure)
    end
  end
end
